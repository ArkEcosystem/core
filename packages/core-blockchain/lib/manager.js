'use strict';

const async = require('async')

const client = require('@arkecosystem/client')
const { slots } = client
const { Block } = client.models

const pluginManager = require('@arkecosystem/core-plugin-manager')
const logger = pluginManager.get('logger')

const stateMachine = require('./state-machine')
const sleep = require('./utils/sleep')

let instance

module.exports = class BlockchainManager {
  /**
   * Create a new blockchain manager instance.
   * @param  {Number} config
   * @param  {Boolean} networkStart
   * @return {void}
   */
  constructor (config, networkStart) {
    if (!instance) {
      instance = this
    } else {
      throw new Error('Can\'t initialise 2 blockchains!')
    }

    this.config = config

    // flag to force a network start
    stateMachine.state.networkStart = !!networkStart
    if (stateMachine.state.networkStart) {
      // TODO: Reword message below
      logger.warn('ARK Core is launched in Genesis Network Start. Unless you know what you are doing, this is likely wrong.')
      logger.info('Starting ARK Core for a new world, welcome aboard :rocket:')
    }

    this.actions = stateMachine.actionMap(this)

    this.__setupProcessQueue()
    this.__setupRebuildQueue()
  }

  /**
   * Get a blockchain manager instance.
   * @return {BlockchainManager}
   */
  static getInstance () {
    return instance
  }

  /**
   * Dispatch an event to transition the state machine.
   * @param  {String} event
   * @return {void}
   */
  dispatch (event) {
    const nextState = stateMachine.transition(stateMachine.state.blockchain, event)

    logger.debug(`event '${event}': ${JSON.stringify(stateMachine.state.blockchain.value)} -> ${JSON.stringify(nextState.value)} -> actions: ${JSON.stringify(nextState.actions)}`)

    stateMachine.state.blockchain = nextState

    nextState.actions.forEach(actionKey => {
      const action = this.actions[actionKey]

      if (action) {
        return setTimeout(() => action.call(this, event), 0)
      }

      logger.error(`No action '${actionKey}' found`)
    })
  }

  /**
   * Start the blockchain.
   * @return {void}
   */
  start () {
    this.dispatch('START')
  }

  /**
   * Determine if the blockchain is ready.
   * @return {Boolean}
   */
  async isReady () {
    /**
     * TODO: this state needs to be set after the state.lastBlock is available if ARK_ENV=testnet
     */
    while (!stateMachine.state.started) await sleep(1000)
    return true
  }

  checkNetwork () {
  }

  /**
   * Update network status.
   * @return {void}
   */
  updateNetworkStatus () {
  }

  /**
   * Rebuild N blocks in the blockchain.
   * @param  {Number} nblocks
   * @return {void}
   */
  rebuild (nblocks) {
  }

  /**
   * Reset the state of the blockchain.
   * @return {void}
   */
  async resetState () {
    this.pauseQueues()
    this.clearQueues()

    stateMachine.state = {
      blockchain: stateMachine.initialState,
      started: false,
      lastBlock: null,
      lastDownloadedBlock: null
    }

    this.resumeQueues()
    return this.start()
  }

  /**
   * Hand the given transactions to the transaction handler.
   * @param  {Array} transactions
   * @return {Array}
   */
  postTransactions (transactions) {
    logger.info(`Received ${transactions.length} new transactions`)

    return this.getTransactionHandler().addTransactions(transactions)
  }

  /**
   * Push a block to the process queue.
   * @param  {Block} block
   * @return {void}
   */
  postBlock (block) {
    logger.info(`Received new block at height ${block.height} with ${block.numberOfTransactions} transactions`)

    if (stateMachine.state.started) {
      this.processQueue.push(block)
      stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock
    } else {
      logger.info('Block disregarded because blockchain is not ready')
    }
  }

  /**
   * Rollback all blocks up to the previous round.
   * @return {void}
   */
  async deleteBlocksToLastRound () {
    const deleteLastBlock = async () => {
      const lastBlock = stateMachine.state.lastBlock
      await this.getDatabaseConnection().deleteBlock(lastBlock)
      const newLastBlock = await this.getDatabaseConnection().getBlock(lastBlock.data.previousBlock)
      stateMachine.state.lastBlock = newLastBlock
      stateMachine.state.lastDownloadedBlock = newLastBlock
    }

    const height = stateMachine.state.lastBlock.data.height
    const maxDelegates = this.config.getConstants(height).activeDelegates
    const previousRound = Math.floor((height - 1) / maxDelegates)

    if (previousRound < 2) {
      return
    }

    const newHeigth = previousRound * maxDelegates
    logger.info(`Removing ${height - newHeigth} blocks to reset current round`)

    while (stateMachine.state.lastBlock.data.height >= newHeigth) {
      await deleteLastBlock()
    }

    logger.info('Blocks removed')
    await this.getDatabaseConnection().deleteRound(previousRound + 1)
  }

  /**
   * Remove N number of blocks.
   * @param  {Number} nblocks
   * @return {void}
   */
  async removeBlocks (nblocks) {
    const undoLastBlock = async () => {
      const lastBlock = stateMachine.state.lastBlock

      await this.getDatabaseConnection().undoBlock(lastBlock)
      await this.getDatabaseConnection().deleteBlock(lastBlock)
      await this.getTransactionHandler().undoBlock(lastBlock)

      const newLastBlock = await this.getDatabaseConnection().getBlock(lastBlock.data.previousBlock)
      stateMachine.state.lastBlock = newLastBlock
      stateMachine.state.lastDownloadedBlock = newLastBlock
    }

    const __removeBlocks = async (nblocks) => {
      if (nblocks < 1) {
        return
      }

      logger.info(`Undoing block ${stateMachine.state.lastBlock.data.height}`)

      await undoLastBlock()
      await __removeBlocks(nblocks - 1)
    }

    logger.info(`Removing ${nblocks} blocks. Reset to height ${stateMachine.state.lastBlock.data.height}`)

    this.pauseQueues()
    this.clearQueues()
    await __removeBlocks(nblocks)
    this.resumeQueues()
  }

  /**
   * Pause all queues.
   * @return {void}
   */
  pauseQueues () {
    this.rebuildQueue.pause()
    this.processQueue.pause()
  }

  /**
   * Flush all queues.
   * @return {void}
   */
  clearQueues () {
    this.rebuildQueue.remove(() => true)
    stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock
    this.processQueue.remove(() => true)
  }

  /**
   *  Resue all queues.
   * @return {void}
   */
  resumeQueues () {
    this.rebuildQueue.resume()
    this.processQueue.resume()
  }

  /**
   * Check if the given block is in order.
   * @param  {Block}  block
   * @param  {Block}  nextBlock
   * @return {Boolean}
   */
  isChained (block, nextBlock) {
    return nextBlock.data.previousBlock === block.data.id && nextBlock.data.timestamp > block.data.timestamp && nextBlock.data.height === block.data.height + 1
  }

  /**
   * Hande a block during a rebuild.
   * @param  {Block} block
   * @param  {Object} state
   * @param  {Function} qcallback
   * @return {Object}
   */
  async rebuildBlock (block, state, qcallback) {
    if (block.verification.verified) {
      if (this.isChained(state.lastBlock, block)) {
        // save block on database
        await this.getDatabaseConnection().saveBlockAsync(block)
        // committing to db every 10,000 blocks
        if (block.data.height % 10000 === 0) await this.getDatabaseConnection().saveBlockCommit()
        state.lastBlock = block
        qcallback()
      } else if (block.data.height > state.lastBlock.data.height + 1) {
        logger.info(`Block ${block.data.height} disregarded because blockchain not ready to accept it. Last block: ${state.lastBlock.data.height}`)
        state.lastDownloadedBlock = state.lastBlock
        qcallback()
      } else if (block.data.height < state.lastBlock.data.height || (block.data.height === state.lastBlock.data.height && block.data.id === state.lastBlock.data.id)) {
        logger.debug(`Block ${block.data.height} disregarded because already in blockchain`)
        qcallback()
      } else {
        state.lastDownloadedBlock = state.lastBlock
        logger.info(`Block ${block.data.height} disregarded because on a fork`)
        qcallback()
      }
    } else {
      logger.warn(`Block ${block.data.height} disregarded because verification failed`)
      qcallback()
    }
  }

  /**
   * Process the given block.
   * @param  {Block} block
   * @param  {Object} state
   * @param  {Function} qcallback
   * @return {(Function|void)}
   */
  async processBlock (block, state, qcallback) {
    if (!block.verification.verified) {
      logger.warn(`Block ${block.data.height} disregarded because verification failed`)

      return qcallback()
    }

    if (this.isChained(state.lastBlock, block)) {
      await this.acceptChainedBlock(block, state)
    } else {
      await this.manageUnchainedBlock(block, state)
    }

    qcallback()
  }

  /**
   * Accept a new chained block.
   * @param  {Block} block
   * @param  {Object} state
   * @return {void}
   */
  async acceptChainedBlock (block, state) {
    try {
      await this.getDatabaseConnection().applyBlock(block)
      await this.getDatabaseConnection().saveBlock(block)
      state.lastBlock = block

      // broadcast only recent blocks
      if (slots.getTime() - block.data.timestamp < 10) {
        this.getNetworkInterface().broadcastBlock(block)
      }

      this.getTransactionHandler().removeForgedTransactions(block.transactions)
    } catch (error) {
      logger.error(error.stack)
      logger.error(`Refused new block: ${JSON.stringify(block.data)}`)

      this.dispatch('FORK')
    }

    state.lastDownloadedBlock = state.lastBlock
  }

  /**
   * Manage a block that is out of order.
   * @param  {Block} block
   * @param  {Object} state
   * @return {void}
   */
  async manageUnchainedBlock (block, state) {
    if (block.data.height > state.lastBlock.data.height + 1) {
      logger.info(`Blockchain not ready to accept new block at height ${block.data.height}. Last block: ${state.lastBlock.data.height}`)
    } else if (block.data.height < state.lastBlock.data.height) {
      logger.debug(`Block ${block.data.height} disregarded because already in blockchain`)
    } else if (block.data.height === state.lastBlock.data.height && block.data.id === state.lastBlock.data.id) {
      logger.debug(`Block ${block.data.height} just received`)
    } else {
      const isValid = await this.getDatabaseConnection().validateForkedBlock(block)

      if (isValid) {
        this.dispatch('FORK')
      } else {
        logger.info(`Forked block disregarded because it is not allowed to forge. Caused by delegate: ${block.data.generatorPublicKey}`)
      }
    }
  }

  /**
   * Get unconfirmed transactions for the specified block size.
   * @param  {Number}  blockSize
   * @param  {Boolean} forForging
   * @return {Object}
   */
  async getUnconfirmedTransactions (blockSize, forForging = false) {
    let retItems = forForging
      ? await this.getTransactionHandler().getTransactionsForForging(0, blockSize)
      : await this.getTransactionHandler().getUnconfirmedTransactions(0, blockSize)

    return {
      transactions: retItems,
      poolSize: await this.getTransactionHandler().getPoolSize(),
      count: retItems ? retItems.length : -1
    }
  }

  /**
   * Determine if the blockchain is synced.
   * @param  {Block}  block
   * @return {Boolean}
   */
  isSynced (block) {
    block = block || stateMachine.state.lastBlock.data

    return slots.getTime() - block.timestamp < 3 * this.config.getConstants(block.height).blocktime
  }

  /**
   * Determine if the blockchain is synced after a rebuild.
   * @param  {Block}  block
   * @return {Boolean}
   */
  isRebuildSynced (block) {
    block = block || stateMachine.state.lastBlock.data
    logger.info('Remaining block timestamp', slots.getTime() - block.timestamp)

    return slots.getTime() - block.timestamp < 100 * this.config.getConstants(block.height).blocktime
  }

  /**
   * Get the state of the blockchain.
   * @return {Object}
   */
  getState () {
    return stateMachine.state
  }

  /**
   * Get the network (p2p) interface.
   * @return {P2PInterface}
   */
  getNetworkInterface () {
    return pluginManager.get('p2p')
  }

  /**
   * Get the transaction handler.
   * @return {TransactionPoolHandler}
   */
  getTransactionHandler () {
    return pluginManager.get('transaction-handler')
  }

  /**
   * Get the database connection.
   * @return {ConnectionInterface}
   */
  getDatabaseConnection () {
    return pluginManager.get('database')
  }

  /**
   * Initialise the process queue.
   * @return {void}
   */
  __setupProcessQueue () {
    this.processQueue = async.queue(
      (block, qcallback) => this.processBlock(new Block(block), stateMachine.state, qcallback),
      1
    )

    this.processQueue.drain = () => this.dispatch('PROCESSFINISHED')
  }

  /**
   * Initialise the rebuild queue.
   * @return {void}
   */
  __setupRebuildQueue () {
    this.rebuildQueue = async.queue(
      (block, qcallback) => this.rebuildQueue.paused ? qcallback() : this.rebuildBlock(new Block(block), stateMachine.state, qcallback),
      1
    )

    this.rebuildQueue.drain = () => this.dispatch('REBUILDFINISHED')
  }
}
