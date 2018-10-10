'use strict'

const pgPromise = require('pg-promise')
const crypto = require('crypto')
const chunk = require('lodash/chunk')
const fs = require('fs')

const { ConnectionInterface } = require('@arkecosystem/core-database')

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')

const { Bignum, models: { Block, Transaction } } = require('@arkecosystem/crypto')

const SPV = require('./spv')
const Cache = require('./cache')

const migrations = require('./migrations')
const QueryExecutor = require('./sql/query-executor')
const repositories = require('./repositories')
const { camelizeColumns } = require('./utils')

module.exports = class PostgresConnection extends ConnectionInterface {
  /**
   * Make the database connection instance.
   * @return {PostgresConnection}
   */
  async make () {
    if (this.db) {
      throw new Error('Database connection already initialised')
    }

    logger.debug('Connecting to database')

    this.asyncTransaction = null

    try {
      await this.connect()
      await this.__registerQueryExecutor()
      await this.__registerCache()
      await this.__runMigrations()
      await this.__registerModels()
      await super._registerRepositories()
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
   * @return {void}
   */
  async connect () {
    const initialization = {
      receive (data, result, e) {
        camelizeColumns(pgp, data)
      },
      extend (object) {
        for (const repository of Object.keys(repositories)) {
          object[repository] = new repositories[repository](object, pgp)
        }
      }
    }

    const pgp = pgPromise({...this.config.initialization, ...initialization})

    this.pgp = pgp
    this.db = this.pgp(this.config.connection)
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

    logger.debug('Disconnecting from database')

    return this.pgp.end()
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

    if (this.activeDelegates && this.activeDelegates.length && this.activeDelegates[0].round === round) {
      return this.activeDelegates
    }

    const data = await this.db.rounds.findById(round)

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

    this.activeDelegates = data

    return this.activeDelegates
  }

  /**
   * Store the given round.
   * @param  {Array} delegates
   * @return {Array}
   */
  saveRound (delegates) {
    logger.info(`Saving round ${delegates[0].round}`)

    return this.db.rounds.create(delegates)
  }

  /**
   * Delete the given round.
   * @param  {Number} round
   * @return {Promise}
   */
  async deleteRound (round) {
    return this.db.rounds.delete(round)
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

    let data = await this.db.rounds.delegates()

    // NOTE: At the launch of the blockchain we may not have enough delegates.
    // In order to have enough forging delegates we complete the list in a
    // deterministic way (alphabetical order of publicKey).
    if (data.length < maxDelegates) {
      const chosen = data.map(delegate => delegate.publicKey)

      const fillerWallets = chosen.length
        ? await this.db.rounds.placeholdersWithout(maxDelegates - data.length, chosen)
        : await this.db.rounds.placeholders(maxDelegates - data.length)

      data = data.concat(fillerWallets)
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

      return this.walletManager.all()
    } catch (error) {
      logger.error(error.stack)
    }
  }

  /**
   * Load all wallets from database.
   * @return {Array}
   */
  async loadWallets () {
    const wallets = await this.db.wallets.all()

    this.walletManager.index(wallets)

    return this.walletManager.all()
  }

  /**
   * Commit wallets from the memory.
   * @param  {Boolean} force
   * @return {void}
   */
  async saveWallets (force) {
    const wallets = this.walletManager.allByPublicKey().filter(wallet => {
      return wallet.publicKey && (force || wallet.dirty)
    })

    if (force) { // all wallets to be updated, performance is better without upsert
      await this.db.wallets.truncate()

      for (const items of chunk(wallets, 5000)) {
        try {
          await this.db.wallets.create(items)
        } catch (error) {
          logger.error(error)
        }
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
      try {
        const queries = wallets.map(wallet => this.db.wallets.updateOrCreate(wallet))

        await this.db.tx(t => t.batch(queries))
      } catch (error) {
        logger.error(error)
      }
    }

    logger.info(`${wallets.length} modified wallets committed to database`)

    // NOTE: commented out as more use cases to be taken care of
    // this.walletManager.purgeEmptyNonDelegates()

    this.walletManager.clear()
  }

  /**
   * Commit the given block.
   * NOTE: to be used when node is in sync and committing newly received blocks
   * @param  {Block} block
   * @return {void}
   */
  async saveBlock (block) {
    try {
      const queries = [this.db.blocks.create(block.data)]

      if (block.transactions.length > 0) {
        queries.push(this.db.transactions.create(block.transactions))
      }

      await this.db.tx(t => t.batch(queries))
    } catch (err) {
      logger.error(err.message)
    }
  }

  /**
   * Stores the block in memory. Generated insert statements are stored in the this.asyncTransaction, to be later saved to the database by calling saveBlockCommit.
   * NOTE: to use when rebuilding to decrease the number of database tx, and commit blocks (save only every 1000s for instance) using saveBlockCommit
   * @param  {Block} block
   * @return {void}
   */
  enqueueSaveBlockAsync (block) {
    if (!this.asyncTransaction) {
      this.asyncTransaction = []
    }

    this.asyncTransaction.push(this.db.blocks.create(block.data))

    if (block.transactions.length > 0) {
      this.asyncTransaction.push(this.db.transactions.create(block.transactions))
    }
  }

  /**
   * Commit the block database transaction.
   * NOTE: to be used in combination with enqueueSaveBlockAsync
   * @return {void}
   */
  async saveBlockCommit () {
    if (!this.asyncTransaction) {
      return
    }

    logger.debug('Committing database transaction')

    try {
      await this.db.tx(t => t.batch(this.asyncTransaction))

      this.asyncTransaction = null
    } catch (error) {
      logger.error(error)

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
    try {
      const queries = [
        this.db.transactions.deleteByBlock(block.data.id),
        this.db.blocks.delete(block.data.id)
      ]

      await this.db.tx(t => t.batch(queries))
    } catch (error) {
      logger.error(error.stack)

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
      this.asyncTransaction = []
    }

    await this.db.transactions.deleteByBlock(block.data.id)
    await this.db.blocks.delete(block.data.id)
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
      await this.db.tx(t => t.batch(this.asyncTransaction))

      this.asyncTransaction = null
    } catch (error) {
      logger.error(error)

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
    const block = await this.db.blocks.findById(id)

    if (!block) {
      return null
    }

    const transactions = await this.db.transactions.findByBlock(block.id)

    block.transactions = transactions.map(({ serialized }) => Transaction.deserialize(serialized.toString('hex')))

    return new Block(block)
  }

  /**
   * Get the last block.
   * @return {(Block|null)}
   */
  async getLastBlock () {
    const block = await this.db.blocks.latest()

    if (!block) {
      return null
    }

    const transactions = await this.db.transactions.latestByBlock(block.id)

    block.transactions = transactions.map(({ serialized }) => Transaction.deserialize(serialized.toString('hex')))

    return new Block(block)
  }

  /**
   * Get a transaction.
   * @param  {Number} id
   * @return {Promise}
   */
  async getTransaction (id) {
    return this.db.transactions.findById(id)
  }

  /**
   * Get common blocks for the given IDs.
   * @param  {Array} ids
   * @return {Promise}
   */
  getCommonBlock (ids) {
    return this.db.blocks.common(ids)
  }

  /**
   * Get transactions for the given IDs.
   * @param  {Array} ids
   * @return {Array}
   */
  async getTransactionsFromIds (ids) {
    return this.db.transactions.findManyById(ids)
  }

  /**
   * Get forged transactions for the given IDs.
   * @param  {Array} ids
   * @return {Array}
   */
  async getForgedTransactionsIds (ids) {
    if (!ids.length) {
      return []
    }

    const transactions = await this.db.transactions.forged(ids)

    return transactions.map(transaction => transaction.id)
  }

  /**
   * Get blocks for the given offset and limit.
   * @param  {Number} offset
   * @param  {Number} limit
   * @return {Array}
   */
  async getBlocks (offset, limit) {
    const blocks = await this.db.blocks.heightRange(offset, offset + limit)

    let transactions = []

    const ids = blocks.map(block => block.id)

    if (ids.length) {
      transactions = await this.db.transactions.latestByBlocks(ids)

      transactions = transactions.map(tx => {
        const data = Transaction.deserialize(tx.serialized.toString('hex'))
        data.blockId = tx.blockId
        return data
      })
    }

    for (const block of blocks) {
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
    const blocks = await this.db.blocks.recent()

    return blocks.map(block => block.id)
  }

  /**
   * Get the headers of blocks for the given offset and limit.
   * @param  {Number} offset
   * @param  {Number} limit
   * @return {Array}
   */
  async getBlockHeaders (offset, limit) {
    const blocks = await this.db.blocks.headers(offset, offset + limit)

    return blocks.map(block => Block.serialize(block))
  }

  /**
   * Get the cache object
   * @return {Cache}
   */
  getCache () {
    return this.cache
  }

  /**
   * Run all migrations.
   * @return {void}
   */
  async __runMigrations () {
    for (const migration of migrations) {
      await this.query.none(migration)
    }
  }

  /**
   * Register all models.
   * @return {void}
   */
  async __registerModels () {
    this.models = {}

    for (const [key, Value] of Object.entries(require('./models'))) {
      this.models[key.toLowerCase()] = new Value(this.pgp)
    }
  }

  /**
   * Register the query builder.
   * @return {void}
   */
  __registerQueryExecutor () {
    this.query = new QueryExecutor(this)
  }

  /**
   * Register event listeners.
   * @return {void}
   */
  __registerListeners () {
    super.__registerListeners()

    emitter.on('wallet:cold:created', async coldWallet => {
      try {
        const wallet = await this.db.wallets.findByAddress(coldWallet.address)

        if (wallet) {
          Object.keys(wallet).forEach(key => {
            if (['balance'].indexOf(key) !== -1) {
              return
            }

            coldWallet[key] = key !== 'voteBalance' ? wallet[key] : new Bignum(wallet[key])
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
    const { count } = await this.db.blocks.count()

    return count
  }

  /**
   * This auxiliary method returns some stats about the blocks that are
   * used to verify the blockchain
   * @return {Promise}
   */
  async __blockStats () {
    return this.db.blocks.statistics()
  }

  /**
   * This auxiliary method returns some stats about the transactions that are
   * used to verify the blockchain
   * @return {Promise}
   */
  async __transactionStats () {
    return this.db.transactions.statistics()
  }
}
