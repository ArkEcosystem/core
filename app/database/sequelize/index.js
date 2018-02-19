const Sequelize = require('sequelize')
const Block = require('app/models/block')
const Transaction = require('app/models/transaction')
const config = require('app/core/config')
const logger = require('app/core/logger')
const schema = require('app/database/sequelize/schema')
const DBInterface = require('app/core/dbinterface')
const webhookManager = require('app/core/managers/webhook').getInstance()

module.exports = class SequelizeDB extends DBInterface {
  async init (params) {
    if (this.db) {
      throw new Error('Already initialised')
    }

    this.db = new Sequelize(params.uri, {
      dialect: params.dialect,
      logging: !!params.logging,
      operatorsAliases: Sequelize.Op
    })

    await this.db.authenticate()

    const models = await schema(this.db)
    models.forEach(model => (this[`${model.tableName}Table`] = model))

    this.registerHooks()
  }

  registerHooks () {
    if (config.webhooks.enabled) {
      this.blocksTable.afterCreate((block) => webhookManager.emit('block.created', block));
      this.transactionsTable.afterCreate((transaction) => webhookManager.emit('transaction.created', transaction));
    }
  }

  async getActiveDelegates (height) {
    const activeDelegates = config.getConstants(height).activeDelegates
    const round = ~~(height / activeDelegates)

    if (this.activedelegates && this.activedelegates.length && this.activedelegates[0].round === round) {
      return this.activedelegates
    }

    const data = await this.roundsTable.findAll({
      where: {
        round: round
      },
      order: [[ 'publicKey', 'ASC' ]]
    })

    return data.map(a => a.dataValues).sort((a, b) => b.balance - a.balance)
  }

  saveRounds (rounds) {
    return this.roundsTable.bulkCreate(rounds)
  }

  deleteRound (round) {
    return this.roundsTable.destroy({where: {round}})
  }

  async buildDelegates (block) {
    const activeDelegates = config.getConstants(block.data.height).activeDelegates

    let data = await this.walletsTable.findAll({
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
    if (data.length < activeDelegates) {
      const data2 = await this.walletsTable.findAll({
        attributes: [
          'publicKey'
        ],
        where: {
          username: {
            [Sequelize.Op.ne]: null
          }
        },
        order: [[ 'publicKey', 'ASC' ]],
        limit: activeDelegates - data.length
      })

      data = data.concat(data2)
    }

    // logger.info(`got ${data.length} voted delegates`)
    const round = parseInt(block.data.height / 51)
    this.activedelegates = data
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 51)
      .map(a => ({...{round: round}, ...a.dataValues}))

    logger.debug(`generated ${this.activedelegates.length} active delegates`)

    return this.activedelegates
  }

  async buildWallets () {
    this.walletManager.reset()

    try {
      // Received TX
      logger.printTracker('SPV Building', 1, 7, 'received transactions')
      let data = await this.transactionsTable.findAll({
        attributes: [
          'recipientId',
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount']
        ],
        where: {type: 0},
        group: 'recipientId'
      })

      data.forEach(row => {
        const wallet = this.walletManager.getWalletByAddress(row.recipientId)
        if (wallet) {
          wallet.balance = parseInt(row.amount)
        } else {
          logger.warn(`lost cold wallet: ${row.recipientId} ${row.amount}`)
        }
      })

      // Block Rewards
      logger.printTracker('SPV Building', 2, 7, 'block rewards')
      data = await this.db.query('select `generatorPublicKey`, sum(`reward`+`totalFee`) as reward, count(*) as produced from blocks group by `generatorPublicKey`', {type: Sequelize.QueryTypes.SELECT})
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.generatorPublicKey)
        wallet.balance += parseInt(row.reward)
      })

      // Last block forged for each delegate
      data = await this.db.query('select *, max(`timestamp`) from blocks group by `generatorPublicKey`', {type: Sequelize.QueryTypes.SELECT})
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.generatorPublicKey)
        wallet.lastBlock = row
      })

      // Sent Transactions
      data = await this.transactionsTable.findAll({
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
          logger.warn(`Negative balance should never happen except from premining address: ${wallet}`)
        }
      })

      // Second Signature
      data = await this.transactionsTable.findAll({
        attributes: [
          'senderPublicKey',
          'serialized'
        ],
        where: {type: 1}}
      )
      logger.printTracker('SPV Building', 4, 7, 'second signatures')
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
        wallet.secondPublicKey = Transaction.deserialize(row.serialized.toString('hex')).asset.signature.publicKey
      })

      // Delegates
      data = await this.transactionsTable.findAll({
        attributes: [
          'senderPublicKey',
          'serialized'
        ],
        where: {type: 2}}
      )
      logger.printTracker('SPV Building', 5, 7, 'delegates')
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
        wallet.username = Transaction.deserialize(row.serialized.toString('hex')).asset.delegate.username
        this.walletManager.updateWallet(wallet)
      })

      // Votes
      data = await this.transactionsTable.findAll({
        attributes: [
          'senderPublicKey',
          'serialized'
        ],
        order: [[ 'createdAt', 'DESC' ]],
        where: {type: 3}}
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
      data = await this.transactionsTable.findAll({
        attributes: [
          'senderPublicKey',
          'serialized'
        ],
        order: [[ 'createdAt', 'DESC' ]],
        where: {type: 4}}
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
      logger.error(error)
    }
  }

  // must be called before builddelegates for  new round
  async updateDelegateStats (activedelegates) {
    if (!activedelegates) {
      return
    }
    goofy.debug('Calculating delegate statistics')
    try {
      let lastBlockGenerators = await this.db.query(`SELECT id, generatorPublicKey FROM blocks WHERE height/51 = ${activedelegates[0].round}`, {type: Sequelize.QueryTypes.SELECT})

        activedelegates.forEach(delegate => {
        let idx = lastBlockGenerators.findIndex(blockGenerator => blockGenerator.generatorPublicKey === delegate.publicKey)
        const wallet = this.walletManager.getWalletByPublicKey(delegate.publicKey)

        idx === -1 ? wallet.missedBlocks++ : wallet.producedBlocks++
      })
    } catch (error) {
      goofy.error(error)
    }
  }

  async saveWallets (force) {
    await this.db.transaction(t =>
      Promise.all(
        Object.values(this.walletManager.walletsByPublicKey || {})
          // cold addresses are not saved on database
          .filter(acc => acc.publicKey && (force || acc.dirty))
          .map(acc => this.walletsTable.upsert(acc, {transaction: t}))
      )
    )

    logger.info('Rebuilt wallets saved')

    return Object.values(this.walletManager.walletsByAddress).forEach(acc => (acc.dirty = false))
  }

  async saveBlock (block) {
    let transaction

    try {
      transaction = await this.db.transaction()
      await this.blocksTable.create(block.data, {transaction})
      await this.transactionsTable.bulkCreate(block.transactions || [], {transaction})
      await transaction.commit()
    } catch (error) {
      logger.error(error)
      await transaction.rollback()
    }
  }

  async deleteBlock (block) {
    let transaction

    try {
      transaction = await this.db.transaction()
      await this.transactionsTable.destroy({where: {blockId: block.data.id}}, {transaction})
      await this.blocksTable.destroy({where: {id: block.data.id}}, {transaction})
      await transaction.commit()
    } catch (error) {
      logger.error(error)
      await transaction.rollback()
    }
  }

  async getBlock (id) {
    const block = await this.blocksTable.findOne({
      include: [{
        model: this.transactionsTable,
        attributes: ['serialized']
      }],
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      },
      where: {
        id: id
      }
    })

    const data = await this.transactionsTable.findAll({where: {blockId: block.id}})
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

  async getLastBlock () {
    const block = await this.blocksTable.findOne({order: [['height', 'DESC']]})
    if (!block) return null
    const data = await this.transactionsTable.findAll({where: {blockId: block.id}})
    block.transactions = data.map(tx => Transaction.deserialize(tx.serialized.toString('hex')))

    return new Block(block)
  }

  async getBlocks (offset, limit) {
    const last = offset + limit
    const blocks = await this.blocksTable.findAll({
      include: [{
        model: this.transactionsTable,
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
    const blocks = await this.blocksTable.findAll({
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
