'use strict'

const Sequelize = require('sequelize')
const Op = Sequelize.Op
const crypto = require('crypto')
const Umzug = require('umzug')
const glob = require('tiny-glob')
const path = require('path')
const fs = require('fs-extra')

const { ConnectionInterface } = require('@arkecosystem/core-database')

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')

const { Block, Transaction } = require('@arkecosystem/crypto').models

const WalletBuilder = require('./builder/wallet')
const QueryBuilder = require('./query-builder')

module.exports = class SequelizeConnection extends ConnectionInterface {
  /**
   * Make the database connection instance.
   * @return {SequelizeConnection}
   */
  async make () {
    if (this.connection) {
      throw new Error('Already initialised')
    }

    if (this.config.dialect === 'sqlite' && this.config.storage !== ':memory:') {
      await fs.ensureFile(this.config.storage)
    }

    this.connection = new Sequelize({
      ...this.config,
      ...{ operatorsAliases: Op }
    })

    this.asyncTransaction = null

    try {
      await this.connect()
      await this.__registerQueryBuilder()
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
    try {
      await this.saveBlockCommit()
    } catch (error) {
      logger.warn('Issue in commiting blocks, database might be corrupted')
      logger.warn(error.message)
    }

    await this.connection.close()
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
  saveRound (activeDelegates) {
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
      group: ['vote'],
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
          ['vote', 'publicKey']
        ],
        group: ['vote'],
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

    const spvPath = `${process.env.ARK_PATH_DATA}/spv.json`
    if (fs.existsSync(spvPath)) {
      fs.removeSync(spvPath)
      logger.info('ARK Core ended unexpectedly - resuming from where we left off :runner:')
      return this.loadWallets()
    }

    try {
      const walletBuilder = new WalletBuilder(this)
      await walletBuilder.build(height)

      await this.__registerListeners()

      return this.walletManager.walletsByAddress || []
    } catch (error) {
      logger.error(error.stack)
    }
  }

  /**
   * Load all wallets from database.
   * @return {void}
   */
  async loadWallets () {
    const wallets = await this.models.wallet.findAll()
    wallets.forEach(wallet => this.walletManager.reindex(wallet.dataValues))

    return this.walletManager.walletsByAddress || []
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

    logger.debug('Updating delegate statistics...')

    try {
      const maxDelegates = config.getConstants(block.data.height).activeDelegates
      const lastBlockGenerators = await this.connection.query(`SELECT id, "generatorPublicKey", "timestamp" FROM blocks ORDER BY "timestamp" DESC LIMIT ${maxDelegates}`, {type: Sequelize.QueryTypes.SELECT})

      delegates.forEach(delegate => {
        let index = lastBlockGenerators.findIndex(blockGenerator => blockGenerator.generatorPublicKey === delegate.publicKey)
        let wallet = this.walletManager.getWalletByPublicKey(delegate.publicKey)

        if (index === -1) {
          wallet.missedBlocks++

          emitter.emit('forging.missing', {
            delegate: wallet,
            block: block.data
          })
        } else {
          wallet.producedBlocks++
          wallet.lastBlock = lastBlockGenerators[index]
          wallet.forgedFees += block.data.totalFee
          wallet.forgedRewards += block.data.reward
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
    const wallets = Object.values(this.walletManager.walletsByPublicKey || {}).filter(wallet => wallet.publicKey && (force || wallet.dirty))
    const chunk = 5000

    // breaking into chunks of 5k wallets, to prevent from loading RAM with GB of SQL data
    for (let i = 0, j = wallets.length; i < j; i += chunk) {
      await this.connection.transaction(dbtransaction =>
        Promise.all(
          wallets
            .slice(i, i + chunk)
            .map(wallet => this.models.wallet.upsert(wallet, { dbtransaction }))
        )
      )
    }

    logger.info(`${wallets.length} modified wallets committed to database`)

    // this.walletManager.purgeEmptyNonDelegates()

    return Object.values(this.walletManager.walletsByAddress).forEach(wallet => (wallet.dirty = false))
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
    block.transactions = data.map(transaction => Transaction.deserialize(transaction.serialized.toString('hex')))

    return new Block(block)
  }

  /**
   * Get a transaction.
   * @param  {Number} id
   * @return {Promise}
   */
  async getTransaction (id) {
    const rows = await this.connection.query(`SELECT * FROM transactions WHERE id = '${id}'`, {type: Sequelize.QueryTypes.SELECT})

    return rows[0]
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
   * @param  {Array} transactionIds
   * @return {Array}
   */
  async getTransactionsFromIds (transactionIds) {
    const rows = await this.connection.query(`SELECT serialized FROM transactions WHERE id IN ('${transactionIds.join('\',\'')}')`, {type: Sequelize.QueryTypes.SELECT})
    const transactions = await rows.map(row => Transaction.deserialize(row.serialized.toString('hex')))

    return transactionIds.map((transaction, i) => (transactionIds[i] = transactions.find(tx2 => tx2.id === transactionIds[i])))
  }

  /**
   * Get forged transactions for the given IDs.
   * @param  {Array} transactionIds
   * @return {Array}
   */
  async getForgedTransactionsIds (transactionIds) {
    const rows = await this.connection.query(`SELECT id FROM transactions WHERE id IN ('${transactionIds.join('\',\'')}')`, {type: Sequelize.QueryTypes.SELECT})

    return rows.map(transaction => transaction.id)
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
    block.transactions = data.map(transaction => Transaction.deserialize(transaction.serialized.toString('hex')))

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
      },
      order: [['height', 'ASC']]
    })

    const nblocks = blocks.map(block => {
      block.dataValues.transactions = block.dataValues.transactions
        .map(transaction => transaction.serialized.toString('hex'))

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
   * Create an OR or AND condition.
   * @param  {String} type
   * @param  {Object} params
   * @return {}
   */
  createCondition (type, params) {
    if (!Object.keys(Sequelize.Op).includes(type)) {
      return {}
    }

    return { [Sequelize.Op[type]]: params }
  }

  /**
   * Register the query builder.
   * @return {void}
   */
  __registerQueryBuilder () {
    this.query = new QueryBuilder(this.connection)
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
