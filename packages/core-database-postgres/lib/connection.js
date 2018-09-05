'use strict'

const pgp = require('pg-promise')
const crypto = require('crypto')
const chunk = require('lodash/chunk')
const fs = require('fs-extra')

const { ConnectionInterface } = require('@arkecosystem/core-database')

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')

const { Block, Transaction } = require('@arkecosystem/crypto').models

const SPV = require('./spv')
const Cache = require('./cache')

const QueryBuilder = require('./sql/builder')
const { migrations, repositories } = require('./sql')

module.exports = class PostgresConnection extends ConnectionInterface {
  /**
   * Make the database connection instance.
   * @return {PostgresConnection}
   */
  async make () {
    logger.verbose('Connecting to database')

    if (this.db) {
      throw new Error('Database connection already initialised')
    }

    this.asyncTransaction = null

    try {
      await this.connect()
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
   * @return {void}
   */
  async connect () {
    const initialization = {
      extend (obj, dc) {
          obj.blocks = new repositories.Blocks(obj, pgp)
          obj.rounds = new repositories.Rounds(obj, pgp)
          obj.transactions = new repositories.Transactions(obj, pgp)
          obj.wallets = new repositories.Wallets(obj, pgp)
      }
    }

    this.pgp = pgp({...this.config.initialization, ...initialization})
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

    logger.verbose('Disconnecting from database')

    return this.pgp.end()
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

    // TODO: replace with raw query
    return this.models.round.bulkCreate(activeDelegates)
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

    let data = await this.db.wallets.roundDelegates()

    // NOTE: At the launch of the blockchain we may not have enough delegates.
    // In order to have enough forging delegates we complete the list in a
    // deterministic way (alphabetical order of publicKey).
    if (data.length < maxDelegates) {
      const chosen = data.map(delegate => delegate.publicKey)

      const fillerWallets = chosen.length
        ? await this.db.wallets.roundFillersExcept(maxDelegates - data.length, chosen)
        : await this.db.wallets.roundFillers(maxDelegates - data.length)

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

    if (force) {
      await this.db.wallets.truncate()

      for (const items of chunk(wallets, 5000)) {
        try {
          await this.db.wallets.createMany(items)
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
        const queries = wallets.map(wallet => this.db.wallets.updateOrCreate(wallets))

        await this.db.tx(t => t.batch(queries))
      } catch (error) {
        logger.error(error)
      }
    }

    logger.info(`${wallets.length} modified wallets committed to database`)

    // commented out as more use cases to be taken care of
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
   * Commit the given block (async version).
   * NOTE: to use when rebuilding to decrease the number of database tx, and commit blocks (save only every 1000s for instance) using saveBlockCommit
   * @param  {Block} block
   * @return {void}
   */
  async saveBlockAsync (block) {
    if (!this.asyncTransaction) {
      this.asyncTransaction = []
    }

    this.asyncTransaction.push(this.db.blocks.create(block.data))

    if (block.transactions.length > 0) {
      this.asyncTransaction.push(this.db.transactions.create(block.transactions))
    }

    await this.db.tx(t => t.batch(this.asyncTransaction))
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
        this.db.transaction.delete(block.data.id),
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

    await this.db.transaction.delete(block.data.id)
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
    return this.db.blocks.findById(id)
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
    return this.db.blocks.findManyById(ids)
  }

  /**
   * Get forged transactions for the given IDs.
   * @param  {Array} ids
   * @return {Array}
   */
  async getForgedTransactionsIds (ids) {
    const transactions = await this.db.blocks.forged(ids)

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
   * Register the query builder.
   * @return {void}
   */
  __registerQueryBuilder () {
    this.query = new QueryBuilder(this)
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
