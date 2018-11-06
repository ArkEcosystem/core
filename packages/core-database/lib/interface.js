'use strict'

const { crypto, slots } = require('@arkecosystem/crypto')
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')
const WalletManager = require('./wallet-manager')
const { Block } = require('@arkecosystem/crypto').models
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const { roundCalculator } = require('@arkecosystem/core-utils')
const cloneDeep = require('lodash/cloneDeep')
const assert = require('assert')

module.exports = class ConnectionInterface {
  /**
   * @constructor
   * @param {Object} config
   */
  constructor (config) {
    this.config = config
    this.connection = null
    this.blocksInCurrentRound = null
    this.stateStarted = false

    this.__registerListeners()
  }

  /**
   * Get the current connection.
   * @return {ConnectionInterface}
   */
  getConnection () {
    return this.connection
  }

  /**
   * Connect to a database.
   * @return {void}
   * @throws Error
   */
  async connect () {
    throw new Error('Method [connect] not implemented!')
  }

  /**
   * Disconnect from a database.
   * @return {void}
   * @throws Error
   */
  async disconnect () {
    throw new Error('Method [disconnect] not implemented!')
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
    throw new Error('Method [verifyBlockchain] not implemented!')
  }

  /**
   * Get the top 51 delegates.
   * @param  {Number} height
   * @param  {Array} delegates
   * @return {void}
   * @throws Error
   */
  async getActiveDelegates (height, delegates) {
    throw new Error('Method [getActiveDelegates] not implemented!')
  }

  /**
   * Load a list of wallets into memory.
   * @param  {Number} height
   * @return {Boolean} success
   * @throws Error
   */
  async buildWallets (height) {
    throw new Error('Method [buildWallets] not implemented!')
  }

  /**
   * Commit wallets from the memory.
   * @param  {Boolean} force
   * @return {void}
   * @throws Error
   */
  async saveWallets (force) {
    throw new Error('Method [saveWallets] not implemented!')
  }

  /**
   * Commit the given block.
   * NOTE: to be used when node is in sync and committing newly received blocks
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  async saveBlock (block) {
    throw new Error('Method [saveBlock] not implemented!')
  }

  /**
   * Queue a query to save the given block.
   * NOTE: Must call commitQueuedQueries() to save to database.
   * NOTE: to use when rebuilding to decrease the number of database transactions, and commit blocks (save only every 1000s for instance) by calling commit
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  enqueueSaveBlock (block) {
    throw new Error('Method [enqueueSaveBlock] not implemented!')
  }

  /**
   * Queue a query to delete the given block.
   * See also enqueueSaveBlock
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  enqueueDeleteBlock (block) {
    throw new Error('Method [enqueueDeleteBlock] not implemented!')
  }

  /**
   * Queue a query to delete the round at given height.
   * See also enqueueSaveBlock and enqueueDeleteBlock
   * @param  {Number} height
   * @return {void}
   * @throws Error
   */
  enqueueDeleteRound (height) {
    throw new Error('Method [enqueueDeleteRound] not implemented!')
  }

  /**
   * Commit all queued queries to the database.
   * NOTE: to be used in combination with other enqueue-functions.
   * @return {void}
   * @throws Error
   */
  async commitQueuedQueries () {
    throw new Error('Method [commitQueuedQueries] not implemented!')
  }

  /**
   * Delete the given block.
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  async deleteBlock (block) {
    throw new Error('Method [deleteBlock] not implemented!')
  }

  /**
   * Get a block.
   * @param  {Block} id
   * @return {void}
   * @throws Error
   */
  async getBlock (id) {
    throw new Error('Method [getBlock] not implemented!')
  }

  /**
   * Get last block.
   * @return {void}
   * @throws Error
   */
  async getLastBlock () {
    throw new Error('Method [getLastBlock] not implemented!')
  }

  /**
   * Get blocks for the given offset and limit.
   * @param  {Number} offset
   * @param  {Number} limit
   * @return {void}
   * @throws Error
   */
  async getBlocks (offset, limit) {
    throw new Error('Method [getBlocks] not implemented!')
  }

  /**
   * Get top count blocks ordered by height DESC.
   * NOTE: Only used when trying to restore database integrity. The returned blocks may be unchained.
   * @param  {Number} count
   * @return {void}
   * @throws Error
   */
  async getTopBlocks (count) {
    throw new Error('Method [getTopBlocks] not implemented!')
  }

  /**
   * Get recent block ids.
   * @return {[]String}
   */
  async getRecentBlockIds () {
    throw new Error('Method [getRecentBlockIds] not implemented!')
  }

  /**
   * Store the given round.
   * @param  {Array} activeDelegates
   * @return {void}
   * @throws Error
   */
  async saveRound (activeDelegates) {
    throw new Error('Method [saveRound] not implemented!')
  }

  /**
   * Delete the given round.
   * @param  {Number} round
   * @return {void}
   * @throws Error
   */
  async deleteRound (round) {
    throw new Error('Method [deleteRound] not implemented!')
  }

  /**
   * Update delegate statistics in memory.
   * NOTE: must be called before saving new round of delegates
   * @param  {Block} block
   * @param  {Array} delegates
   * @return {void}
   */
  updateDelegateStats (height, delegates) {
    if (!delegates || !this.blocksInCurrentRound) {
      return
    }

    logger.debug('Updating delegate statistics')

    try {
      delegates.forEach(delegate => {
        let producedBlocks = this.blocksInCurrentRound.filter(blockGenerator => blockGenerator.data.generatorPublicKey === delegate.publicKey)
        let wallet = this.walletManager.findByPublicKey(delegate.publicKey)

        if (producedBlocks.length === 0) {
          wallet.missedBlocks++
          logger.debug(`Delegate ${wallet.username} (${wallet.publicKey}) just missed a block. Total: ${wallet.missedBlocks}`)
          wallet.dirty = true
          emitter.emit('forger.missing', {
            delegate: wallet
          })
        }
      })
    } catch (error) {
      logger.error(error.stack)
    }
  }

  /**
   * Apply the round.
   * Note that the round is applied and the end of the round (so checking height + 1)
   * so the next block to apply starting the new round will be ready to be validated
   * @param  {Number} height
   * @return {void}
   */
  async applyRound (height) {
    const nextHeight = height === 1 ? 1 : height + 1
    const maxDelegates = config.getConstants(nextHeight).activeDelegates

    if (nextHeight % maxDelegates === 1) {
      const round = Math.floor((nextHeight - 1) / maxDelegates) + 1

      if (!this.forgingDelegates || this.forgingDelegates.length === 0 || (this.forgingDelegates.length && this.forgingDelegates[0].round !== round)) {
        logger.info(`Starting Round ${round} :dove_of_peace:`)

        try {
          this.updateDelegateStats(height, this.forgingDelegates)
          this.saveWallets(false) // save only modified wallets during the last round
          const delegates = this.walletManager.loadActiveDelegateList(maxDelegates, nextHeight) // get active delegate list from in-memory wallet manager
          this.saveRound(delegates) // save next round delegate list non-blocking
          this.forgingDelegates = await this.getActiveDelegates(nextHeight, delegates) // generate the new active delegates list
          this.blocksInCurrentRound.length = 0
        } catch (error) {
          // trying to leave database state has it was
          await this.deleteRound(round)
          throw error
        }
      } else {
        logger.warn(`Round ${round} has already been applied. This should happen only if you are a forger. :warning:`)
      }
    }
  }

  /**
   * Remove the round.
   * @param  {Number} height
   * @return {void}
   */
  async revertRound (height) {
    const { round, nextRound, maxDelegates } = roundCalculator.calculateRound(height)

    if (nextRound === round + 1 && height >= maxDelegates) {
      logger.info(`Back to previous round: ${round} :back:`)

      const delegates = await this.__calcPreviousActiveDelegates(round)
      this.forgingDelegates = await this.getActiveDelegates(height, delegates)

      await this.deleteRound(nextRound)
    }
  }

  /**
   * Calculate the active delegates of the previous round. In order to do
   * so we need to go back to the start of that round. Therefore we create
   * a temporary wallet manager with all delegates and revert all blocks
   * and transactions of that round to get the initial vote balances
   * which are then used to restore the original order.
   * @param {Number} round
   */
  async __calcPreviousActiveDelegates (round) {
    // TODO: cache the blocks of the last X rounds
    this.blocksInCurrentRound = await this.__getBlocksForRound(round)

    // Create temp wallet manager from all delegates
    const tempWalletManager = new WalletManager()
    tempWalletManager.index(cloneDeep(this.walletManager.allByUsername()))

    // Revert all blocks in reverse order
    let height = 0
    for (let i = this.blocksInCurrentRound.length - 1; i >= 0; i--) {
      tempWalletManager.revertBlock(this.blocksInCurrentRound[i])
      height = this.blocksInCurrentRound[i].data.height
    }

    // The first round has no active delegates
    if (height === 1) {
      return []
    }

    // Assert that the height is the beginning of a round.
    const { maxDelegates } = roundCalculator.calculateRound(height)
    assert(height > 1 && height % maxDelegates === 1)

    // Now retrieve the active delegate list from the temporary wallet manager.
    return tempWalletManager.loadActiveDelegateList(maxDelegates, height)
  }

  /**
   * Validate a delegate.
   * @param  {Block} block
   * @return {void}
   */
  async validateDelegate (block) {
    if (this.__isException(block.data)) {
      return true
    }

    const delegates = await this.getActiveDelegates(block.data.height)
    const slot = slots.getSlotNumber(block.data.timestamp)
    const forgingDelegate = delegates[slot % delegates.length]

    const generatorUsername = this.walletManager.findByPublicKey(block.data.generatorPublicKey).username

    if (!forgingDelegate) {
      logger.debug(`Could not decide if delegate ${generatorUsername} (${block.data.generatorPublicKey}) is allowed to forge block ${block.data.height.toLocaleString()} :grey_question:`)
    } else if (forgingDelegate.publicKey !== block.data.generatorPublicKey) {
      const forgingUsername = this.walletManager.findByPublicKey(forgingDelegate.publicKey).username

      throw new Error(`Delegate ${generatorUsername} (${block.data.generatorPublicKey}) not allowed to forge, should be ${forgingUsername} (${forgingDelegate.publicKey}) :-1:`)
    } else {
      logger.debug(`Delegate ${generatorUsername} (${block.data.generatorPublicKey}) allowed to forge block ${block.data.height.toLocaleString()} :+1:`)
    }

    return true
  }

  /**
   * Validate a forked block.
   * @param  {Block} block
   * @return {void}
   */
  async validateForkedBlock (block) {
    await this.validateDelegate(block)
  }

  /**
   * Apply the given block.
   * @param  {Block} block
   * @return {void}
   */
  async applyBlock (block) {
    await this.validateDelegate(block)
    this.walletManager.applyBlock(block)

    if (this.blocksInCurrentRound) {
      this.blocksInCurrentRound.push(block)
    }

    await this.applyRound(block.data.height)
    block.transactions.forEach(tx => this.__emitTransactionEvents(tx))
    emitter.emit('block.applied', block.data)
  }

  /**
   * Emit events for the specified transaction.
   * @param  {Object} transaction
   * @return {void}
   */
  __emitTransactionEvents (transaction) {
    emitter.emit('transaction.applied', transaction.data)

    if (transaction.type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
      emitter.emit('delegate.registered', transaction.data)
    }

    if (transaction.type === TRANSACTION_TYPES.DELEGATE_RESIGNATION) {
      emitter.emit('delegate.resigned', transaction.data)
    }

    if (transaction.type === TRANSACTION_TYPES.VOTE) {
      const vote = transaction.asset.votes[0]

      emitter.emit(vote.startsWith('+') ? 'wallet.vote' : 'wallet.unvote', {
        delegate: vote,
        transaction: transaction.data
      })
    }
  }

  /**
   * Remove the given block.
   * @param  {Block} block
   * @return {void}
   */
  async revertBlock (block) {
    await this.revertRound(block.data.height)
    await this.walletManager.revertBlock(block)

    if (this.blocksInCurrentRound) {
      this.blocksInCurrentRound.pop()
      // COMMENTED OUT: needs to be sure is properly synced
      // if (b.data.id !== block.data.id) {
      //   logger.debug(`block to revert: ${JSON.stringify(b.data)}`)
      //   logger.debug(`reverted block: ${JSON.stringify(block.data)}`)
      //   throw new Error('Reverted wrong block. Restart is needed 💣')
      // }
    }

    emitter.emit('block.reverted', block.data)
  }

  /**
   * Verify a transaction.
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  async verifyTransaction (transaction) {
    const senderId = crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)

    let sender = this.walletManager.findByAddress(senderId) // should exist

    if (!sender.publicKey) {
      sender.publicKey = transaction.data.senderPublicKey
      this.walletManager.reindex(sender)
    }

    const dbTransaction = await this.getTransaction(transaction.data.id)

    return sender.canApply(transaction.data) && !dbTransaction
  }

  /**
   * Get blocks for round.
   * @param  {number} round
   * @return {[]Block}
   */
  async __getBlocksForRound (round) {
    let lastBlock
    if (container.has('state')) {
      lastBlock = container.resolve('state').getLastBlock()
    } else {
      lastBlock = await this.getLastBlock()
    }

    if (!lastBlock) {
      return []
    }

    let height = +lastBlock.data.height
    if (!round) {
      round = roundCalculator.calculateRound(height).round
    }

    const maxDelegates = config.getConstants(height).activeDelegates
    height = (round * maxDelegates) + 1

    const blocks = await this.getBlocks(height - maxDelegates, maxDelegates)

    return blocks.map(b => new Block(b))
  }

  /**
   * Register event listeners.
   * @return {void}
   */
  __registerListeners () {
    emitter.on('state:started', () => {
      this.stateStarted = true
    })
  }

  /**
   * Register the wallet container.
   * @return {void}
   */
  async _registerWalletManager () {
    this.walletManager = new WalletManager()
  }

  /**
   * Register the wallet and delegate repositories.
   * @return {void}
   */
  async _registerRepositories () {
    this['wallets'] = new (require('./repositories/wallets'))(this)
    this['delegates'] = new (require('./repositories/delegates'))(this)
  }

  /**
   * Determine if the given block is an exception.
   * @param  {Object} block
   * @return {Boolean}
   */
  __isException (block) {
    if (!config) {
      return false
    }

    if (!Array.isArray(config.network.exceptions.blocks)) {
      return false
    }

    return config.network.exceptions.blocks.includes(block.id)
  }
}
