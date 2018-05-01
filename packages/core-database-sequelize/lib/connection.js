'use strict'

const Sequelize = require('sequelize')
const crypto = require('crypto')
const Umzug = require('umzug')
const glob = require('tiny-glob')
const path = require('path')
const fs = require('fs-extra')
const expandHomeDir = require('expand-home-dir')

const { Connection } = require('@arkecosystem/core-database')

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const logger = pluginManager.get('logger')
const emitter = pluginManager.get('event-emitter')

const client = require('@arkecosystem/client')
const { Block, Transaction } = client.models
const { TRANSACTION_TYPES } = client.constants

module.exports = class SequelizeConnection extends Connection {
  /**
   * Connect to the database.
   * @return {Boolean}
   */
  async connect () {
    return this.connection.authenticate()
  }

  /**
   * Disconnect from the database.
   * @return {Boolean}
   */
  async disconnect () {
    return this.connection.close()
  }

  /**
   * Make the database connection instance.
   * @return {SequelizeConnection}
   */
  async make () {
    if (this.connection) {
      throw new Error('Already initialised')
    }

    if (this.config.dialect === 'sqlite') {
      const databasePath = expandHomeDir(this.config.uri.substring(7))

      this.config.uri = `sqlite:${databasePath}`

      await fs.ensureFile(databasePath)
    }

    this.connection = new Sequelize(this.config.uri, {
      dialect: this.config.dialect,
      logging: this.config.logging,
      operatorsAliases: Sequelize.Op
    })

    this.asyncTransaction = null

    try {
      await this.connect()
      await this.__runMigrations()
      await this.__registerModels()
      await this.__registerRepositories()
      await super._registerWalletManager()

      return this
    } catch (error) {
      logger.error('Unable to connect to the database', error.stack)
      process.exit(1)
    }
  }

  /**
   * Get the top 51 delegates.
   * @param  {Number} height
   * @return {Array}
   */
  async getActiveDelegates (height) {
    const maxDelegates = config.getConstants(height).activeDelegates
    const round = Math.floor((height - 1) / maxDelegates) + 1

    if (this.activedelegates && this.activedelegates.length && this.activedelegates[0].round === round) {
      return this.activedelegates
    }

    let data = await this.models.round.findAll({
      where: { round },
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

  /**
   * Store the given round.
   * @param  {Array} activeDelegates
   * @return {Array}
   */
  saveRounds (activeDelegates) {
    logger.info(`Saving round ${activeDelegates[0].round}`)
    return this.models.round.bulkCreate(activeDelegates)
  }

  /**
   * Delete the given round.
   * @param  {Number} round
   * @return {Boolean}
   */
  deleteRound (round) {
    return this.models.round.destroy({where: {round}})
  }

  /**
   * Load a list of delegates into memory.
   * @param  {Number} maxDelegates
   * @param  {Number} height
   * @return {Array}
   */
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

    logger.debug(`Loaded ${data.length} active delegates`)

    return data
  }

  /**
   * Load a list of wallets into memory.
   * @param  {Number} height
   * @return {Array}
   */
  async buildWallets (height) {
    this.walletManager.reset()
    const maxDelegates = config.getConstants(height).activeDelegates

    try {
      // Received TX
      logger.printTracker('SPV Building', 1, 7, 'Received transactions')
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
          logger.warn(`Lost cold wallet: ${row.recipientId} ${row.amount}`)
        }
      })

      // Block Rewards
      logger.printTracker('SPV Building', 2, 7, 'Block rewards')
      data = await this.connection.query('select "generatorPublicKey", sum("reward"+"totalFee") as reward, count(*) as produced from blocks group by "generatorPublicKey"', {type: Sequelize.QueryTypes.SELECT})
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.generatorPublicKey)
        wallet.balance += parseInt(row.reward)
      })

      // Last block forged for each active delegate
      data = await this.connection.query(`select  id, "generatorPublicKey", "timestamp" from blocks ORDER BY "timestamp" DESC LIMIT ${maxDelegates}`, {type: Sequelize.QueryTypes.SELECT})
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
      logger.printTracker('SPV Building', 3, 7, 'Sent transactions')
      data.forEach(row => {
        let wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
        wallet.balance -= parseInt(row.amount) + parseInt(row.fee)
        if (wallet.balance < 0 && !this.walletManager.isGenesis(wallet)) {
          logger.warn(`Negative balance: ${wallet}`)
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
      logger.printTracker('SPV Building', 4, 7, 'Second signatures')
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
      logger.printTracker('SPV Building', 5, 7, 'Delegates')
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
      logger.printTracker('SPV Building', 6, 7, 'Votes')

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
      logger.printTracker('SPV Building', 7, 7, 'Multisignatures')
      data.forEach(row => {
        const wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
        wallet.multisignature = Transaction.deserialize(row.serialized.toString('hex')).asset.multisignature
      })

      logger.stopTracker('SPV Building', 7, 7)
      logger.info(`SPV rebuild finished, wallets in memory: ${Object.keys(this.walletManager.walletsByAddress).length}`)
      logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.delegatesByUsername).length}`)

      await this.__registerListeners()

      return this.walletManager.walletsByAddress || []
    } catch (error) {
      logger.error(error.stack)
    }
  }

  /**
   * Update delegate statistics in memory.
   * NOTE: must be called before saving new round of delegates
   * @param  {Block} block
   * @param  {Array} delegates
   * @return {void}
   */
  async updateDelegateStats (block, delegates) {
    if (!delegates) {
      return
    }

    logger.debug('Calculating delegate statistics')
    try {
      const maxDelegates = config.getConstants(block.data.height).activeDelegates
      let lastBlockGenerators = await this.connection.query(`select id, "generatorPublicKey", "timestamp" from blocks ORDER BY "timestamp" DESC LIMIT ${maxDelegates}`, {type: Sequelize.QueryTypes.SELECT})
      // console.log(lastBlockGenerators)

      delegates.forEach(delegate => {
        let idx = lastBlockGenerators.findIndex(blockGenerator => blockGenerator.generatorPublicKey === delegate.publicKey)
        let wallet = this.walletManager.getWalletByPublicKey(delegate.publicKey)

        if (idx === -1) {
          wallet.missedBlocks++

          emitter.emit('forging.missing', block)
        } else {
          wallet.producedBlocks++
          wallet.lastBlock = lastBlockGenerators[idx]

          emitter.emit('block.forged', block)
        }
      })
    } catch (error) {
      logger.error(error.stack)
    }
  }

  /**
   * Commit wallets from the memory.
   * @param  {Boolean} force
   * @return {Object}
   */
  async saveWallets (force) {
    const wallets = Object.values(this.walletManager.walletsByPublicKey || {}).filter(acc => acc.publicKey && (force || acc.dirty))
    const chunk = 5000

    // breaking into chunks of 5k wallets, to prevent from loading RAM with GB of SQL data
    for (let i = 0, j = wallets.length; i < j; i += chunk) {
      await this.connection.transaction(t =>
        Promise.all(wallets.slice(i, i + chunk).map(acc => this.models.wallet.upsert(acc, {transaction: t})))
      )
    }

    logger.info('Rebuilt wallets saved')

    this.walletManager.purgeEmptyNonDelegates()

    return Object.values(this.walletManager.walletsByAddress).forEach(acc => (acc.dirty = false))
  }

  /**
   * Commit the given block.
   * NOTE: to be used when node is in sync and committing newly received blocks
   * @param  {Block} block
   * @return {Object}
   */
  async saveBlock (block) {
    let transaction

    try {
      transaction = await this.connection.transaction()
      await this.models.block.create(block.data, {transaction})
      await this.models.transaction.bulkCreate(block.transactions || [], {transaction})
      await transaction.commit()
    } catch (error) {
      logger.error(error.stack)
      await transaction.rollback()
    }
  }

  /**
   * Commit the given block (async version).
   * NOTE: to use when rebuilding to decrease the number of database tx, and commit blocks (save only every 1000s for instance) using saveBlockCommit
   * @param  {Block} block
   * @return {void}
   */
  async saveBlockAsync (block) {
    if (!this.asyncTransaction) {
      this.asyncTransaction = await this.connection.transaction()
    }

    await this.models.block.create(block.data, {transaction: this.asyncTransaction})
    await this.models.transaction.bulkCreate(block.transactions || [], {transaction: this.asyncTransaction})
  }

  /**
   * Commit the block database transaction.
   * NOTE: to be used in combination with saveBlockAsync
   * @return {void}
   */
  async saveBlockCommit () {
    if (!this.asyncTransaction) {
      return
    }

    logger.debug('Committing database transaction')

    try {
      await this.asyncTransaction.commit()
    } catch (error) {
      logger.error(error)
      await this.asyncTransaction.rollback()
    }

    this.asyncTransaction = null
  }

  /**
   * Delete the given block.
   * @param  {Block} block
   * @return {void}
   */
  async deleteBlock (block) {
    let transaction

    try {
      transaction = await this.connection.transaction()
      await this.models.transaction.destroy({where: {blockId: block.data.id}}, {transaction})
      await this.models.block.destroy({where: {id: block.data.id}}, {transaction})
      await transaction.commit()
    } catch (error) {
      logger.error(error.stack)
      await transaction.rollback()
    }
  }

  /**
   * Get a block.
   * @param  {Number} id
   * @return {Block}
   */
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
      where: { id }
    })

    const data = await this.models.transaction.findAll({where: {blockId: block.id}})
    block.transactions = data.map(tx => Transaction.deserialize(tx.serialized.toString('hex')))

    return new Block(block)
  }

  /**
   * Get a transaction.
   * @param  {Number} id
   * @return {Promise}
   */
  getTransaction (id) {
    return this.connection.query(`SELECT * FROM transactions WHERE id = '${id}'`, {type: Sequelize.QueryTypes.SELECT})
  }

  /**
   * Get common blocks for the given IDs.
   * @param  {Array} ids
   * @return {Promise}
   */
  getCommonBlock (ids) {
    return this.connection.query(`SELECT MAX("height") AS "height", "id", "previousBlock", "timestamp" FROM blocks WHERE "id" IN ('${ids.join('\',\'')}') GROUP BY "id" ORDER BY "height" DESC`, {type: Sequelize.QueryTypes.SELECT})
  }

  /**
   * Get transactions for the given IDs.
   * @param  {Array} txids
   * @return {Array}
   */
  async getTransactionsFromIds (txids) {
    const rows = await this.connection.query(`SELECT serialized FROM transactions WHERE id IN ('${txids.join('\',\'')}')`, {type: Sequelize.QueryTypes.SELECT})
    const transactions = await rows.map(row => Transaction.deserialize(row.serialized.toString('hex')))

    return txids.map((tx, i) => (txids[i] = transactions.find(tx2 => tx2.id === txids[i])))
  }

  /**
   * Get forged transactions for the given IDs.
   * @param  {Array} txids
   * @return {Array}
   */
  async getForgedTransactionsIds (txids) {
    const rows = await this.connection.query(`SELECT id FROM transactions WHERE id IN ('${txids.join('\',\'')}')`, {type: Sequelize.QueryTypes.SELECT})

    return rows.map(tx => tx.id)
  }

  /**
   * Get the last block.
   * @return {Block}
   */
  async getLastBlock () {
    let block = await this.models.block.findOne({order: [['height', 'DESC']]})

    if (!block) {
      return null
    }

    block = block.dataValues

    const data = await this.models.transaction.findAll({where: {blockId: block.id}})
    block.transactions = data.map(tx => Transaction.deserialize(tx.serialized.toString('hex')))

    return new Block(block)
  }

  /**
   * Get blocks for the given offset and limit.
   * @param  {Number} offset
   * @param  {Number} limit
   * @return {Array}
   */
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

  /**
   * Get the headers of blocks for the given offset and limit.
   * @param  {Number} offset
   * @param  {Number} limit
   * @return {Array}
   */
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

  /**
   * Run all migrations.
   * @return {Boolean}
   */
  __runMigrations () {
    const umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: this.connection
      },
      migrations: {
        params: [
          this.connection.getQueryInterface(),
          Sequelize
        ],
        path: path.join(__dirname, 'migrations')
      }
    })

    return umzug.up()
  }

  /**
   * Register all models.
   * @return {void}
   */
  async __registerModels () {
    this.models = {}

    const entries = await glob('models/**/*.js', {
      cwd: __dirname, absolute: true, filesOnly: true
    })

    entries.forEach(file => {
      const model = this.connection['import'](file)
      this.models[model.name] = model
    })

    Object.keys(this.models).forEach(modelName => {
      if (this.models[modelName].associate) {
        this.models[modelName].associate(this.models)
      }
    })
  }

  /**
   * Register all repositories.
   * @return {void}
   */
  async __registerRepositories () {
    const repositories = {
      blocks: require('./repositories/blocks'),
      transactions: require('./repositories/transactions')
    }

    for (const [key, value] of Object.entries(repositories)) {
      this[key] = new value(this) // eslint-disable-line new-cap
    }

    await super._registerRepositories()
  }

  /**
   * Register event listeners.
   * @return {void}
   */
  __registerListeners () {
    emitter.on('wallet:cold:created', async coldWallet => {
      try {
        const wallet = await this.models.wallet.findOne({
          where: { address: coldWallet.address }
        })

        if (wallet) {
          Object.keys(wallet.dataValues).forEach(key => {
            if (['balance'].indexOf(key) !== -1) {
              return
            }

            coldWallet[key] = wallet[key]
          })
        }
      } catch (err) {
        logger.error(err)
      }
    })
  }
}
