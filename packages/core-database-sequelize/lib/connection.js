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

const SPV = require('./spv')
const QueryBuilder = require('./query-builder')
const Cache = require('./cache')

module.exports = class SequelizeConnection extends ConnectionInterface {
  /**
   * Make the database connection instance.
   * @return {SequelizeConnection}
   */
  async make () {
    logger.verbose(`Connecting to Sequelize database (${this.config.dialect})`)

    if (this.connection) {
      throw new Error('Sequelize connection already initialised')
    }

    if (this.config.dialect === 'sqlite' && this.config.storage !== ':memory:') {
      await fs.ensureFile(this.config.storage)
    }

    const config = Object.assign({}, this.config) // shallow copy of this.config to safely delete config.redis below
    delete config.redis

    this.connection = new Sequelize({
      ...config,
      ...{
        operatorsAliases: Op,
        logging: process.env.NODE_ENV === 'test' && !process.env.ARK_CI_TEST
      }
    })

    this.asyncTransaction = null

    try {
      await this.connect()
      await this.__registerModels()
      await this.__registerQueryBuilder()
      await this.__registerCache()
      await this.__runMigrations()
      await this.__registerRepositories()
      await super._registerWalletManager()

      this.blocksInCurrentRound = await this.__getBlocksForRound()

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
   * Disconnects from the database and closes the cache.
   * @return {Promise} The successfulness of closing the Sequelize connection
   */
  async disconnect () {
    try {
      await this.saveBlockCommit()
      await this.deleteBlockCommit()
      this.cache.destroy()
    } catch (error) {
      logger.warn('Issue in commiting blocks, database might be corrupted')
      logger.warn(error.message)
    }

    logger.verbose(`Disconnecting from Sequelize database (${this.config.dialect})`)

    return this.connection.close()
  }

  /**
   * Get the cache object
   * @return {Cache}
   */
  getCache () {
    return this.cache
  }

  /**
   * Verify the blockchain stored on db is not corrupted making simple assertions:
   * - Last block is available
   * - Last block height equals the number of stored blocks
   * - Number of stored transactions equals the sum of block.numberOfTransactions in the database
   * - Sum of all tx fees equals the sum of block.totalFee
   * - Sum of all tx amount equals the sum of block.totalAmount
   * @return {Object} An object { valid, errors } with the result of the verification and the errors
   */
  async verifyBlockchain () {
    const errors = []

    const lastBlock = await this.getLastBlock()

    // Last block is available
    if (!lastBlock) {
      errors.push('Last block is not available')
    } else {
      const numberOfBlocks = await this.__numberOfBlocks()

      // Last block height equals the number of stored blocks
      if (lastBlock.data.height !== +numberOfBlocks) {
        errors.push(`Last block height: ${lastBlock.data.height.toLocaleString()}, number of stored blocks: ${numberOfBlocks}`)
      }
    }

    const blockStats = await this.__blockStats()
    const transactionStats = await this.__transactionStats()

    // Number of stored transactions equals the sum of block.numberOfTransactions in the database
    if (blockStats.numberOfTransactions !== transactionStats.count) {
      errors.push(`Number of transactions: ${transactionStats.count}, number of transactions included in blocks: ${blockStats.numberOfTransactions}`)
    }

    // Sum of all tx fees equals the sum of block.totalFee
    if (blockStats.totalFee !== transactionStats.totalFee) {
      errors.push(`Total transaction fees: ${transactionStats.totalFee}, total of block.totalFee : ${blockStats.totalFee}`)
    }

    // Sum of all tx amount equals the sum of block.totalAmount
    if (blockStats.totalAmount !== transactionStats.totalAmount) {
      errors.push(`Total transaction amounts: ${transactionStats.totalAmount}, total of block.totalAmount : ${blockStats.totalAmount}`)
    }

    return {
      valid: !errors.length,
      errors
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

    const data = await this.query
      .select('*')
      .from('rounds')
      .where('round', round)
      .orderBy({
        'balance': 'DESC',
        'public_key': 'ASC'
      })
      .all()

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
    return this.models.round.destroy({ where: {round} })
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

    let data = await this.query
      .select('"vote" AS "publicKey"')
      .sum('balance', 'balance')
      .from('wallets')
      .whereNotNull('vote')
      .groupBy('vote')
      .all()

    // at the launch of blockchain, we may have not enough voted delegates, completing in a deterministic way (alphabetical order of publicKey)
    if (data.length < maxDelegates) {
      const chosen = data.map(delegate => delegate.publicKey)

      let query = this.query
        .select('public_key', '0 as balance')
        .from('wallets')
        .whereNotNull('username')

        if (chosen.length) {
          query = query.whereNotIn('public_key', chosen)
        }

        const data2 = await query.orderBy('public_key', 'ASC')
          .limit(maxDelegates - data.length)
          .all()

      data = data.concat(data2)
    }

    // logger.info(`got ${data.length} voted delegates`)
    const round = Math.floor((height - 1) / maxDelegates) + 1
    data = data
      .sort((a, b) => b.balance - a.balance)
      .slice(0, maxDelegates)
      .map(delegate => ({ ...{ round }, ...delegate }))

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
      const spv = new SPV(this)
      await spv.build(height)

      await this.__registerListeners()

      return this.walletManager.walletsByAddress || {}
    } catch (error) {
      logger.error(error.stack)
    }
  }

  /**
   * Load all wallets from database.
   * @return {void}
   */
  async loadWallets () {
    const wallets = await this.query.select('*').from('wallets').all()
    wallets.forEach(wallet => this.walletManager.reindex(wallet))

    return this.walletManager.walletsByAddress || {}
  }

  /**
   * Commit wallets from the memory.
   * @param  {Boolean} force
   * @return {Object}
   */
  async saveWallets (force) {
    const wallets = Object.values(this.walletManager.walletsByPublicKey || {}).filter(wallet => {
      return wallet.publicKey && (force || wallet.dirty)
    })

    if (force) { // all wallets to be updated, performance is better without upsert
      await this.models.wallet.destroy({truncate: true})
      const chunk = 5000
      // breaking into chunks of 5k wallets, to prevent from loading RAM with GB of SQL data
      for (let i = 0, j = wallets.length; i < j; i += chunk) {
        await this.connection.transaction(async dbtransaction =>
          this.models.wallet.bulkCreate(wallets.slice(i, i + chunk), { transaction: dbtransaction })
        )
      }
    } else {
      // NOTE: UPSERT is far from optimal. It can takes several seconds here
      // if many accounts have to be updated at each round turn
      //
      // What can be done is to update accounts at each block in unsync manner
      // what is really important is that db is sync with wallets in memory
      // at round turn because votes computation to calculate active delegate list is made against database
      //
      // Other solution is to calculate the list of delegates against WalletManager so we can get rid off
      // calling this function in sync manner i.e. 'await saveWallets()' -> 'saveWallets()'
      await this.connection.transaction(async dbtransaction =>
        Promise.all(wallets.map(wallet => this.models.wallet.upsert(wallet, {transaction: dbtransaction})))
      )
    }
    logger.info(`${wallets.length} modified wallets committed to database`)

    // commented out as more use cases to be taken care of
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
      await this.models.block.create(block.data, { transaction })
      if (block.transactions.length > 0) {
        await this.models.transaction.bulkCreate(block.transactions, { transaction })
      }
      await transaction.commit()
    } catch (error) {
      logger.error(error.stack)
      if (error.sql) {
        logger.info('Function saveBlock')
        logger.info(error.sql)
      }
      await transaction.rollback()
      throw error
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

    await this.models.block.create(block.data, { transaction: this.asyncTransaction })
    if (block.transactions.length > 0) {
      await this.models.transaction.bulkCreate(block.transactions, { transaction: this.asyncTransaction })
    }
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
      this.asyncTransaction = null
    } catch (error) {
      logger.error(error)
      if (error.sql) {
        logger.info('Function saveBlockCommit')
        logger.info(error.sql)
      }
      await this.asyncTransaction.rollback()
      this.asyncTransaction = null
      throw error
    }
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
      await this.models.transaction.destroy({ where: { blockId: block.data.id } }, { transaction })
      await this.models.block.destroy({ where: { id: block.data.id } }, { transaction })
      await transaction.commit()
    } catch (error) {
      logger.error(error.stack)
      if (error.sql) {
        logger.info('Function deleteBlock')
        logger.info(error.sql)
      }
      await transaction.rollback()
      throw error
    }
  }

  /**
   * Delete the given block (async version).
   * @param  {Block} block
   * @return {void}
   */
  async deleteBlockAsync (block) {
    if (!this.asyncTransaction) {
      this.asyncTransaction = await this.connection.transaction()
    }
    await this.models.transaction.destroy({ where: { blockId: block.data.id } }, { transaction: this.asyncTransaction })
    await this.models.block.destroy({ where: { id: block.data.id } }, { transaction: this.asyncTransaction })
  }

  /**
   * Commit the block database transaction.
   * NOTE: to be used in combination with deleteBlockAsync
   * @return {void}
   */
  async deleteBlockCommit () {
    if (!this.asyncTransaction) {
      return
    }

    logger.debug('Committing database transaction')

    try {
      await this.asyncTransaction.commit()
      this.asyncTransaction = null
    } catch (error) {
      logger.error(error)
      if (error.sql) {
        logger.info('Function deleteBlockCommit')
        logger.info(error.sql)
      }
      await this.asyncTransaction.rollback()
      this.asyncTransaction = null
      throw error
    }
  }

  /**
   * Get a block.
   * @param  {Number} id
   * @return {Block}
   */
  async getBlock (id) {
    // TODO: caching the last 1000 blocks, in combination with `saveBlock` could help to optimise
    const block = await this.query
      .select('*')
      .from('blocks')
      .where('id', id)
      .first()

    if (!block) {
      return null
    }

    const transactions = await this.query
      .select('serialized')
      .from('transactions')
      .where('block_id', block.id)
      .all()

    block.transactions = transactions.map(({ serialized }) => Transaction.deserialize(serialized.toString('hex')))

    return new Block(block)
  }

  /**
   * Get the last block.
   * @return {(Block|null)}
   */
  async getLastBlock () {
    const block = await this.query
      .select('*')
      .from('blocks')
      .orderBy('height', 'DESC')
      .limit(1)
      .first()

    if (!block) {
      return null
    }

    const transactions = await this.query
      .select('serialized')
      .from('transactions')
      .where('block_id', block.id)
      .orderBy('sequence', 'ASC')
      .all()

    block.transactions = transactions.map(({ serialized }) => Transaction.deserialize(serialized.toString('hex')))

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
    return this.connection.query(`SELECT MAX("height") AS "height", "id", "previous_block", "timestamp" FROM blocks WHERE "id" IN ('${ids.join('\',\'')}') GROUP BY "id" ORDER BY "height" DESC`, {type: Sequelize.QueryTypes.SELECT})
  }

  /**
   * Get transactions for the given IDs.
   * @param  {Array} transactionIds
   * @return {Array}
   */
  async getTransactionsFromIds (transactionIds) {
    return this.connection.query(`SELECT serialized, block_id FROM transactions WHERE id IN ('${transactionIds.join('\',\'')}')`, {type: Sequelize.QueryTypes.SELECT})
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
   * Get blocks for the given offset and limit.
   * @param  {Number} offset
   * @param  {Number} limit
   * @return {Array}
   */
  async getBlocks (offset, limit) {
    let blocks = await this.query
      .select('*')
      .from('blocks')
      .whereBetween('height', offset, offset + limit)
      .orderBy('height', 'ASC')
      .all()

    let transactions = []

    const ids = blocks.map(block => block.id)

    if (ids.length) {
      transactions = await this.query
        .select('block_id', 'serialized')
        .from('transactions')
        .whereIn('block_id', ids)
        .orderBy('sequence', 'ASC')
        .all()
      transactions = transactions.map(tx => {
        const data = Transaction.deserialize(tx.serialized.toString('hex'))
        data.blockId = tx.blockId
        return data
      })
    }

    for (let block of blocks) {
      if (block.numberOfTransactions > 0) {
        block.transactions = transactions.filter(transaction => transaction.blockId === block.id)
      }
    }

    return blocks
  }

  /**
   * Get recent block ids.
   * @return {[]String}
   */
  async getRecentBlockIds () {
    const blocks = await this.query
      .select('id')
      .from('blocks')
      .orderBy({ timestamp: 'DESC' })
      .limit(10)
      .all()

    return blocks.map(block => block.id)
  }

  /**
   * Get the headers of blocks for the given offset and limit.
   * @param  {Number} offset
   * @param  {Number} limit
   * @return {Array}
   */
  async getBlockHeaders (offset, limit) {
    let blocks = await this.query
      .select('*')
      .from('blocks')
      .whereBetween('height', offset, offset + limit)
      .all()

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
    this.query = new QueryBuilder(this.connection, this.models)
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
          Sequelize,
          this
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

    for (const [key, Value] of Object.entries(repositories)) {
      this[key] = new Value(this) // eslint-disable-line new-cap
    }

    await super._registerRepositories()
  }

  /**
   * Register event listeners.
   * @return {void}
   */
  __registerListeners () {
    super.__registerListeners()
    emitter.on('wallet:cold:created', async coldWallet => {
      try {
        const wallet = await this.query
          .select('*')
          .from('wallets')
          .where('address', coldWallet.address)
          .first()

        if (wallet) {
          Object.keys(wallet).forEach(key => {
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

  /**
   * Register the cache.
   * @return {void}
   */
  __registerCache () {
    this.cache = new Cache(this.config.redis)
  }

  /**
   * This auxiliary method returns the number of blocks of the blockchain and
   * is used to verify it
   * @return {Number}
   */
  async __numberOfBlocks () {
    const { count } = await this.query
      .select()
      .countDistinct('height', 'count')
      .from('blocks')
      .first()
    return count
  }

  /**
   * This auxiliary method returns some stats about the blocks that are
   * used to verify the blockchain
   * @return {Object}
   */
  async __blockStats () {
    return this.query
      .select()
      .sum('number_of_transactions', 'numberOfTransactions')
      .sum('total_fee', 'totalFee')
      .sum('total_amount', 'totalAmount')
      .from('blocks')
      .first()
  }

  /**
   * This auxiliary method returns some stats about the transactions that are
   * used to verify the blockchain
   * @return {Object}
   */
  async __transactionStats () {
    return this.query
      .select()
      .countDistinct('id', 'count')
      .sum('fee', 'totalFee')
      .sum('amount', 'totalAmount')
      .from('transactions')
      .first()
  }
}
