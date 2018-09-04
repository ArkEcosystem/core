'use strict'

const async = require('async')
const { crypto, slots } = require('@arkecosystem/crypto')
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')
const WalletManager = require('./wallet-manager')
const { Block } = require('@arkecosystem/crypto').models

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
   * @return {void}
   * @throws Error
   */
  async getActiveDelegates (height) {
    throw new Error('Method [getActiveDelegates] not implemented!')
  }

  /**
   * Load a list of delegates into memory.
   * @param  {Number} maxDelegates
   * @param  {Number} height
   * @return {void}
   * @throws Error
   */
  async buildDelegates (maxDelegates, height) {
    throw new Error('Method [buildDelegates] not implemented!')
  }

  /**
   * Load a list of wallets into memory.
   * @param  {Number} height
   * @return {void}
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
   * Save the given block (async version).
   * NOTE: to use when rebuilding to decrease the number of database transactions, and commit blocks (save only every 1000s for instance) using saveBlockCommit
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  async saveBlockAsync (block) {
    throw new Error('Method [saveBlockAsync] not implemented!')
  }

  /**
   * Commit the block save database transaction.
   * NOTE: to be used in combination with saveBlockAsync
   * @return {void}
   * @throws Error
   */
  async saveBlockCommit () {
    throw new Error('Method [saveBlockCommit] not implemented!')
  }

  /**
   * Delete the given block (async version).
   * NOTE: to use when rebuilding to decrease the number of database transactions, and commit blocks (save only every 1000s for instance) using saveBlockCommit
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  async deleteBlockAsync (block) {
    throw new Error('Method [saveBlockAsync] not implemented!')
  }

  /**
   * Commit the block delete database transaction.
   * NOTE: to be used in combination with deleteBlockAsync
   * @return {void}
   * @throws Error
   */
  async deleteBlockCommit () {
    throw new Error('Method [deleteBlockCommit] not implemented!')
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
  saveRound (activeDelegates) {
    throw new Error('Method [saveRound] not implemented!')
  }

  /**
   * Delete the given round.
   * @param  {Number} round
   * @return {void}
   * @throws Error
   */
  deleteRound (round) {
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
   * Detect if height is the beginning of a new round.
   * @param  {Number} height
   * @return {boolean} true if new round, false if not
   */
  isNewRound (height) {
    const maxDelegates = config.getConstants(height).activeDelegates

    return height % maxDelegates === 1
  }

  getRound (height) {
    const maxDelegates = config.getConstants(height).activeDelegates

    if (height < maxDelegates + 1) {
      return 1
    }

    return Math.floor((height - 1) / maxDelegates) + 1
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

      if (!this.activedelegates || this.activedelegates.length === 0 || (this.activedelegates.length && this.activedelegates[0].round !== round)) {
        logger.info(`Starting Round ${round} :dove_of_peace:`)

        try {
          this.updateDelegateStats(height, this.activedelegates)
          await this.saveWallets(false) // save only modified wallets during the last round

          const delegates = await this.buildDelegates(maxDelegates, nextHeight) // active build delegate list from database state
          await this.saveRound(delegates) // save next round delegate list
          await this.getActiveDelegates(nextHeight) // generate the new active delegates list
          this.blocksInCurrentRound.length = 0
          // TODO: find a better place to call this as this
          // currently blocks execution but needs to be updated every round
          if (this.stateStarted) {
            this.walletManager.updateDelegates()
          }
        } catch (error) {
          // trying to leave database state has it was
          this.deleteRound(round)
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
    const maxDelegates = config.getConstants(height).activeDelegates
    const nextHeight = height + 1

    const round = Math.floor((height - 1) / maxDelegates) + 1
    const nextRound = Math.floor((nextHeight - 1) / config.getConstants(nextHeight).activeDelegates) + 1

    if (nextRound === round + 1 && height > maxDelegates) {
      logger.info(`Back to previous round: ${round} :back:`)
      this.blocksInCurrentRound = await this.__getBlocksForRound(round)

      this.activedelegates = await this.getActiveDelegates(height)

      await this.deleteRound(nextRound)
    }
  }

  /**
   * Validate a delegate.
   * @param  {Block} block
   * @return {void}
   */
  async validateDelegate (block) {
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
    emitter.emit('block.applied', block.data)
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
   * Write blocks to file as a snapshot.
   * @return {void}
   */
  async snapshot () {
    const expandHomeDir = require('expand-home-dir')
    const path = expandHomeDir(container.config('databaseManager').snapshots)

    const fs = require('fs-extra')
    await fs.ensureFile(`${path}/blocks.dat`)

    const wstream = fs.createWriteStream(`${path}/blocks.dat`)

    let max = 100000 // eslint-disable-line no-unused-vars
    let offset = 0
    const writeQueue = async.queue((block, qcallback) => {
      wstream.write(block)
      qcallback()
    }, 1)

    let blocks = await this.getBlockHeaders(offset, offset + 100000)
    writeQueue.push(blocks)
    max = blocks.length
    offset += 100000
    console.log(offset)

    writeQueue.drain = async () => {
      console.log('drain')
      blocks = await this.getBlockHeaders(offset, offset + 100000)
      writeQueue.push(blocks)
      max = blocks.length
      offset += 100000
      console.log(offset)
    }
  }

  /**
   * Get blocks for round.
   * @param  {number} round
   * @return {[]Block}
   */
  async __getBlocksForRound (round) {
    const lastBlock = await this.getLastBlock()
    if (!lastBlock) {
      return []
    }

    let height = +lastBlock.data.height
    if (!round) {
      round = this.getRound(height)
    }

    const maxDelegates = config.getConstants(height).activeDelegates
    height = (round * maxDelegates) + 1

    return (await this.getBlocks(height - maxDelegates, maxDelegates)).map(b => new Block(b))
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
}
