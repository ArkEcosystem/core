const Sequelize = require('sequelize')
const crypto = require('crypto')
const Umzug = require('umzug')
const { Block, Transaction } = require('@arkecosystem/client').models
const config = require('../../core/app/core/config')
const logger = require('../../core/app/core/logger')
const DBInterface = require('../../core/app/core/dbinterface')
const webhookManager = require('../../core/app/core/managers/webhook')
const fg = require('fast-glob')
const path = require('path')
const { TRANSACTION_TYPES } = require('@arkecosystem/client').constants
const expandHomeDir = require('expand-home-dir')

class SequelizeDB extends DBInterface {
  async init (config) {
    if (this.db) {
      throw new Error('Already initialised')
    }

    if (config.options.dialect === 'sqlite') {
        config.options.uri = 'sqlite:' + expandHomeDir(config.options.uri.substring(7))
    }

    this.db = new Sequelize(config.options.uri, {
      dialect: config.options.dialect,
      logging: !!config.options.logging,
      operatorsAliases: Sequelize.Op
    })

    this.asyncTransaction = null

    try {
      await this.db.authenticate()
      logger.info('Database connection has been established.')

      await this.runMigrations()
      logger.info('Database has been migrated.')

      await this.registerModels()
      logger.info('Database models have been registered.')
    } catch (error) {
      logger.error('Unable to connect to the database:')
      logger.error(error.stack)
    }
  }

  runMigrations () {
    const umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: this.db
      },
      migrations: {
        params: [
          this.db.getQueryInterface(),
          Sequelize
        ],
        path: path.join(__dirname, 'migrations')
      }
    })

    return umzug.up()
  }

  async registerModels () {
    this.models = {}

    const entries = await fg(path.resolve(__dirname, 'models/**/*.js'))

    entries.forEach(file => {
      const model = this.db['import'](file)
      this.models[model.name] = model
    })

    Object.keys(this.models).forEach(modelName => {
      if (this.models[modelName].associate) {
        this.models[modelName].associate(this.models)
      }
    })
  }

  async getActiveDelegates (height) {
    const maxDelegates = config.getConstants(height).activeDelegates
    const round = Math.floor((height - 1) / maxDelegates) + 1

    if (this.activedelegates && this.activedelegates.length && this.activedelegates[0].round === round) {
      return this.activedelegates
    }

    let data = await this.models.round.findAll({
      where: {
        round: round
      },
      order: [[ 'balance', 'DESC' ], [ 'publicKey', 'ASC' ]]
    }).map(del => del.dataValues)

    const seedSource = round.toString()
    let currentSeed = crypto.createHash('sha256').update(seedSource, 'utf8').digest()

    for (let i = 0, delCount = data.length; i < delCount; i++) {
      for (let x = 0; x < 4 && i < delCount; i++, x++) {
        const newIndex = currentSeed[x] % delCount
        const b = data[newIndex]
        data[newIndex] = data[i]
        data[i] = b
      }
      currentSeed = crypto.createHash('sha256').update(currentSeed).digest()
    }

    this.activedelegates = data

    return this.activedelegates
  }

  saveRounds (activeDelegates) {
    logger.info(`saving round ${activeDelegates[0].round}`)
    return this.models.round.bulkCreate(activeDelegates)
  }

  deleteRound (round) {
    return this.models.round.destroy({where: {round}})
  }

  async buildDelegates (maxDelegates, height) {
    if (height > 1 && height % maxDelegates !== 1) {
      throw new Error('Trying to build delegates outside of round change')
    }
    let data = await this.models.wallet.findAll({
      attributes: [
        ['vote', 'publicKey'],
        [Sequelize.fn('SUM', Sequelize.col('balance')), 'balance']
      ],
      group: 'vote',
      where: {
        vote: {
          [Sequelize.Op.ne]: null
        }
      }
    })

    // at the launch of blockchain, we may have not enough voted delegates, completing in a deterministic way (alphabetical order of publicKey)
    if (data.length < maxDelegates) {
      const data2 = await this.models.wallet.findAll({
        attributes: [
          'publicKey'
        ],
        where: {
          username: {
            [Sequelize.Op.ne]: null
          },
          publicKey: {
            [Sequelize.Op.notIn]: data.map(d => d.publicKey)
          }
        },
        order: [[ 'publicKey', 'ASC' ]],
        limit: maxDelegates - data.length
      })

      data = data.concat(data2)
    }

    // logger.info(`got ${data.length} voted delegates`)
    const round = Math.floor((height - 1) / maxDelegates) + 1
    data = data
      .sort((a, b) => b.balance - a.balance)
      .slice(0, maxDelegates)
      .map(a => ({...{round: round}, ...a.dataValues}))

    logger.debug(`generated ${data.length} active delegates`)

    return data
  }

  async buildWallets (height) {
    this.walletManager.reset()
    const maxDelegates = config.getConstants(height).activeDelegates

    try {
      // Received TX
      logger.printTracker('SPV Building', 1, 7, 'received transactions')
      let data = await this.models.transaction.findAll({
        attributes: [
          'recipientId',
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount']
        ],
        where: {type: TRANSACTION_TYPES.TRANSFER},
        group: 'recipientId'
      })

      data.forEach(row => {
        const wallet = this.walletManager.getWalletByAddress(row.recipientId)
        if (wallet) {
          wallet.balance = parseInt(row.amount)
        } else {
          logger.warning(`lost cold wallet: ${row.recipientId} ${row.amount}`)
        }
      })

      // Block Rewards
      logger.printTracker('SPV Building', 2, 7, 'block rewards')
      data = await this.db.query('select "generatorPublicKey", sum("reward"+"totalFee") as reward, count(*) as produced from blocks group by "generatorPublicKey"', {type: Sequelize.QueryTypes.SELECT})
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.generatorPublicKey)
        wallet.balance += parseInt(row.reward)
      })

      // Last block forged for each active delegate
      data = await this.db.query(`select  id, "generatorPublicKey", "timestamp" from blocks ORDER BY "timestamp" DESC LIMIT ${maxDelegates}`, {type: Sequelize.QueryTypes.SELECT})
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.generatorPublicKey)
        wallet.lastBlock = row
      })

      // Sent Transactions
      data = await this.models.transaction.findAll({
        attributes: [
          'senderPublicKey',
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount'],
          [Sequelize.fn('SUM', Sequelize.col('fee')), 'fee']
        ],
        group: 'senderPublicKey'
      })
      logger.printTracker('SPV Building', 3, 7, 'sent transactions')
      data.forEach(row => {
        let wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
        wallet.balance -= parseInt(row.amount) + parseInt(row.fee)
        if (wallet.balance < 0) {
          logger.warning(`Negative balance should never happen except from premining address: ${wallet}`)
        }
      })

      // Second Signature
      data = await this.models.transaction.findAll({
        attributes: [
          'senderPublicKey',
          'serialized'
        ],
        where: {type: TRANSACTION_TYPES.SECOND_SIGNATURE}}
      )
      logger.printTracker('SPV Building', 4, 7, 'second signatures')
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
        wallet.secondPublicKey = Transaction.deserialize(row.serialized.toString('hex')).asset.signature.publicKey
      })

      // Delegates
      data = await this.models.transaction.findAll({
        attributes: [
          'senderPublicKey',
          'serialized'
        ],
        where: {type: TRANSACTION_TYPES.DELEGATE}}
      )
      logger.printTracker('SPV Building', 5, 7, 'delegates')
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
        wallet.username = Transaction.deserialize(row.serialized.toString('hex')).asset.delegate.username
        this.walletManager.reindex(wallet)
      })

      // Votes
      data = await this.models.transaction.findAll({
        attributes: [
          'senderPublicKey',
          'serialized'
        ],
        order: [[ 'createdAt', 'DESC' ]],
        where: {type: TRANSACTION_TYPES.VOTE}}
      )
      logger.printTracker('SPV Building', 6, 7, 'votes')

      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
        if (!wallet.voted) {
          let vote = Transaction.deserialize(row.serialized.toString('hex')).asset.votes[0]
          if (vote.startsWith('+')) wallet.vote = vote.slice(1)
          wallet.voted = true
        }
      })

      // Multisignatures
      data = await this.models.transaction.findAll({
        attributes: [
          'senderPublicKey',
          'serialized'
        ],
        order: [[ 'createdAt', 'DESC' ]],
        where: {type: TRANSACTION_TYPES.MULTI_SIGNATURE}}
      )
      logger.printTracker('SPV Building', 7, 7, 'multisignatures')
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
        wallet.multisignature = Transaction.deserialize(row.serialized.toString('hex')).asset.multisignature
      })

      logger.stopTracker('SPV Building', 7, 7)
      logger.info(`SPV rebuild finished, wallets in memory: ${Object.keys(this.walletManager.walletsByAddress).length}`)
      logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.delegatesByUsername).length}`)

      return this.walletManager.walletsByAddress || []
    } catch (error) {
      logger.error(error.stack)
    }
  }

  // must be called before saving new round of delegates
  async updateDelegateStats (block, delegates) {
    if (!delegates) {
      return
    }

    logger.debug('Calculating delegate statistics')
    try {
      const maxDelegates = config.getConstants(block.data.height).activeDelegates
      let lastBlockGenerators = await this.db.query(`select id, "generatorPublicKey", "timestamp" from blocks ORDER BY "timestamp" DESC LIMIT ${maxDelegates}`, {type: Sequelize.QueryTypes.SELECT})
      console.log(lastBlockGenerators)

      delegates.forEach(delegate => {
        let idx = lastBlockGenerators.findIndex(blockGenerator => blockGenerator.generatorPublicKey === delegate.publicKey)
        let wallet = this.walletManager.getWalletByPublicKey(delegate.publicKey)
        if (idx === -1) {
          wallet.missedBlocks++

          webhookManager.getInstance().emit('forging.missing', block)
        } else {
          wallet.producedBlocks++
          wallet.lastBlock = lastBlockGenerators[idx]

          webhookManager.getInstance().emit('block.forged', block)
        }
      })
    } catch (error) {
      logger.error(error.stack)
    }
  }

  async saveWallets (force) {
    await this.db.transaction(t =>
      Promise.all(
        Object.values(this.walletManager.walletsByPublicKey || {})
          // cold addresses are not saved on database
          .filter(acc => acc.publicKey && (force || acc.dirty))
          .map(acc => this.models.wallet.upsert(acc, {transaction: t}))
      )
    )

    logger.info('Rebuilt wallets saved')

    return Object.values(this.walletManager.walletsByAddress).forEach(acc => (acc.dirty = false))
  }

  // to be used when node is in sync and committing newly received blocks
  async saveBlock (block) {
    let transaction
    try {
      transaction = await this.db.transaction()
      await this.models.block.create(block.data, {transaction})
      await this.models.transaction.bulkCreate(block.transactions || [], {transaction})
      await transaction.commit()
    } catch (error) {
      logger.error(error.stack)
      await transaction.rollback()
    }
  }

  // to use when rebuilding to decrease the number of database tx, and commit blocks (save only every 1000s for instance) using saveBlockCommit
  async saveBlockAsync (block) {
    if (!this.asyncTransaction) this.asyncTransaction = await this.db.transaction()
    await this.models.block.create(block.data, {transaction: this.asyncTransaction})
    await this.models.transaction.bulkCreate(block.transactions || [], {transaction: this.asyncTransaction})
  }

  // to be used in combination with saveBlockAsync
  async saveBlockCommit () {
    if (!this.asyncTransaction) return
    logger.debug('Committing DB transaction')
    try {
      await this.asyncTransaction.commit()
    } catch (error) {
      logger.error(error)
      logger.error('boom')

      logger.error(error.sql)
      await this.asyncTransaction.rollback()
    }
    this.asyncTransaction = null
  }

  async deleteBlock (block) {
    let transaction

    try {
      transaction = await this.db.transaction()
      await this.models.transaction.destroy({where: {blockId: block.data.id}}, {transaction})
      await this.models.block.destroy({where: {id: block.data.id}}, {transaction})
      await transaction.commit()
    } catch (error) {
      logger.error(error.stack)
      await transaction.rollback()
    }
  }

  async getBlock (id) {
    // TODO: caching the last 1000 blocks, in combination with `saveBlock` could help to optimise
    const block = await this.models.block.findOne({
      include: [{
        model: this.models.transaction,
        attributes: ['serialized']
      }],
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      },
      where: {
        id: id
      }
    })

    const data = await this.models.transaction.findAll({where: {blockId: block.id}})
    block.transactions = data.map(tx => Transaction.deserialize(tx.serialized.toString('hex')))

    return new Block(block)
  }

  getTransaction (id) {
    return this.db.query(`SELECT * FROM transactions WHERE id = '${id}'`, {type: Sequelize.QueryTypes.SELECT})
  }

  getCommonBlock (ids) {
    return this.db.query(`SELECT MAX("height") AS "height", "id", "previousBlock", "timestamp" FROM blocks WHERE "id" IN ('${ids.join('\',\'')}') GROUP BY "id" ORDER BY "height" DESC`, {type: Sequelize.QueryTypes.SELECT})
  }

  async getTransactionsFromIds (txids) {
    const rows = await this.db.query(`SELECT serialized FROM transactions WHERE id IN ('${txids.join('\',\'')}')`, {type: Sequelize.QueryTypes.SELECT})
    const transactions = await rows.map(row => Transaction.deserialize(row.serialized.toString('hex')))

    return txids.map((tx, i) => (txids[i] = transactions.find(tx2 => tx2.id === txids[i])))
  }

  async getForgedTransactionsIds (txids) {
    const rows = await this.db.query(`SELECT id FROM transactions WHERE id IN ('${txids.join('\',\'')}')`, {type: Sequelize.QueryTypes.SELECT})
    return rows.map(tx => tx.id)
  }

  async getLastBlock () {
    let block = await this.models.block.findOne({order: [['height', 'DESC']]})
    if (!block) return null
    block = block.dataValues
    const data = await this.models.transaction.findAll({where: {blockId: block.id}})
    block.transactions = data.map(tx => Transaction.deserialize(tx.serialized.toString('hex')))
    return new Block(block)
  }

  async getBlocks (offset, limit) {
    const last = offset + limit
    const blocks = await this.models.block.findAll({
      include: [{
        model: this.models.transaction,
        attributes: ['serialized']
      }],
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      },
      where: {
        height: {
          [Sequelize.Op.between]: [offset, last]
        }
      }
    })
    const nblocks = blocks.map(block => {
      block.dataValues.transactions = block.dataValues.transactions.map(tx => tx.serialized.toString('hex'))

      return block.dataValues
    })

    return nblocks
  }

  async getBlockHeaders (offset, limit) {
    const last = offset + limit
    const blocks = await this.models.block.findAll({
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      },
      where: {
        height: {
          [Sequelize.Op.between]: [offset, last]
        }
      }
    })

    return blocks.map(block => Block.serialize(block))
  }
}

module.exports = new SequelizeDB()
