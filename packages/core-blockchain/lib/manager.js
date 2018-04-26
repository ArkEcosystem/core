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
   * [constructor description]
   * @param  {[type]} config       [description]
   * @param  {[type]} networkStart [description]
   * @return {[type]}              [description]
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
      logger.warn('Arkchain is launched in Genesis Network Start. Unless you know what you are doing, this is likely wrong.')
      logger.info('Starting arkchain for a new world, welcome aboard 🚀 🚀 🚀 🚀 🚀 🚀')
    }

    this.actions = stateMachine.actionMap(this)

    this.__setupProcessQueue()
    this.__setupRebuildQueue()
  }

  /**
   * [dispatch description]
   * @param  {[type]} event [description]
   * @return {[type]}       [description]
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
      logger.error(`No action ${actionKey} found`)
    })
  }

  /**
   * [start description]
   * @return {[type]} [description]
   */
  start () {
    this.dispatch('START')
  }

  /**
   * [isReady description]
   * @return {Boolean} [description]
   */
  async isReady () {
    /**
     * TODO: this state needs to be set after the state.lastBlock is available if ARK_ENV=testnet
     */
    while (!stateMachine.state.started) await sleep(1000)
    return true
  }

  /**
   * [getInstance description]
   * @return {[type]} [description]
   */
  static getInstance () {
    return instance
  }

  /**
   * [checkNetwork description]
   * @return {[type]} [description]
   */
  checkNetwork () {
  }

  /**
   * [updateNetworkStatus description]
   * @return {[type]} [description]
   */
  updateNetworkStatus () {
  }

  /**
   * [rebuild description]
   * @param  {[type]} nblocks [description]
   * @return {[type]}         [description]
   */
  rebuild (nblocks) {
  }

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
   * [postTransactions description]
   * @param  {[type]} transactions [description]
   * @return {[type]}              [description]
   */
  postTransactions (transactions) {
    logger.info(`Received ${transactions.length} new transactions`)
    return this.getTransactionHandler().addTransactions(transactions)
  }

  /**
   * [postBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
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
    if (previousRound < 2) return
    const newHeigth = previousRound * maxDelegates
    logger.info('Removing ' + (height - newHeigth) + ' blocks to start from current round')
    while (stateMachine.state.lastBlock.data.height >= newHeigth) await deleteLastBlock()
    logger.info('Blocks removed')
    await this.getDatabaseConnection().deleteRound(previousRound + 1)
  }

  /**
   * [removeBlocks description]
   * @param  {[type]} nblocks [description]
   * @return {[type]}         [description]
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
      if (nblocks < 1) return
      logger.info(`Undoing block ${stateMachine.state.lastBlock.data.height}`)
      await undoLastBlock()
      await __removeBlocks(nblocks - 1)
    }

    logger.info(`Starting ${nblocks} blocks undo from height ${stateMachine.state.lastBlock.data.height}`)
    this.pauseQueues()
    this.clearQueues()
    await __removeBlocks(nblocks)
    this.resumeQueues()
  }

  /**
   * [pauseQueues description]
   * @return {[type]} [description]
   */
  pauseQueues () {
    this.rebuildQueue.pause()
    this.processQueue.pause()
  }

  /**
   * [clearQueues description]
   * @return {[type]} [description]
   */
  clearQueues () {
    this.rebuildQueue.remove(() => true)
    stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock
    this.processQueue.remove(() => true)
  }

  /**
   * [resumeQueues description]
   * @return {[type]} [description]
   */
  resumeQueues () {
    this.rebuildQueue.resume()
    this.processQueue.resume()
  }

  /**
   * [isChained description]
   * @param  {[type]}  block     [description]
   * @param  {[type]}  nextBlock [description]
   * @return {Boolean}           [description]
   */
  isChained (block, nextBlock) {
    return nextBlock.data.previousBlock === block.data.id && nextBlock.data.timestamp > block.data.timestamp && nextBlock.data.height === block.data.height + 1
  }

  /**
   * [rebuildBlock description]
   * @param  {[type]} block     [description]
   * @param  {[type]} state     [description]
   * @param  {[type]} qcallback [description]
   * @return {[type]}           [description]
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
        logger.info(`Block disregarded because blockchain not ready to accept it ${block.data.height} lastBlock ${state.lastBlock.data.height}`)
        state.lastDownloadedBlock = state.lastBlock
        qcallback()
      } else if (block.data.height < state.lastBlock.data.height || (block.data.height === state.lastBlock.data.height && block.data.id === state.lastBlock.data.id)) {
        logger.debug('Block disregarded because already in blockchain')
        qcallback()
      } else {
        state.lastDownloadedBlock = state.lastBlock
        logger.info('Block disregarded because on a fork')
        qcallback()
      }
    } else {
      logger.warn('Block disregarded because verification failed. Tentative to hack the network 💣')
      qcallback()
    }
  }

  /**
   * [processBlock description]
   * @param  {[type]} block     [description]
   * @param  {[type]} state     [description]
   * @param  {[type]} qcallback [description]
   * @return {[type]}           [description]
   */
  async processBlock (block, state, qcallback) {
    if (!block.verification.verified) {
      logger.warn('Block disregarded because verification failed. Tentative to hack the network 💣')

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
   * [acceptChainedBlock description]
   * @param  {[type]} block [description]
   * @param  {[type]} state [description]
   * @return {[type]}       [description]
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
   * [manageUnchainedBlock description]
   * @param  {[type]} block [description]
   * @param  {[type]} state [description]
   * @return {[type]}       [description]
   */
  async manageUnchainedBlock (block, state) {
    if (block.data.height > state.lastBlock.data.height + 1) {
      logger.info(`blockchain not ready to accept new block at height ${block.data.height}, lastBlock ${state.lastBlock.data.height}`)
    } else if (block.data.height < state.lastBlock.data.height) {
      logger.debug('Block disregarded because already in blockchain')
    } else if (block.data.height === state.lastBlock.data.height && block.data.id === state.lastBlock.data.id) {
      logger.debug('Block just received')
    } else {
      const isValid = await this.getDatabaseConnection().validateForkedBlock(block)

      if (isValid) {
        this.dispatch('FORK')
      } else {
        logger.info(`Forked block disregarded because it is not allowed to forge, looks like an attack by delegate ${block.data.generatorPublicKey} 💣`)
      }
    }
  }

  /**
   * [getUnconfirmedTransactions description]
   * @param  {[type]}  blockSize  [description]
   * @param  {Boolean} forForging [description]
   * @return {[type]}             [description]
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
   * [isSynced description]
   * @param  {[type]}  block [description]
   * @return {Boolean}       [description]
   */
  isSynced (block) {
    block = block || stateMachine.state.lastBlock.data

    return slots.getTime() - block.timestamp < 3 * this.config.getConstants(block.height).blocktime
  }

  /**
   * [isBuildSynced description]
   * @param  {[type]}  block [description]
   * @return {Boolean}       [description]
   */
  isBuildSynced (block) {
    block = block || stateMachine.state.lastBlock.data
    logger.info('Remaining block timestamp', slots.getTime() - block.timestamp)

    return slots.getTime() - block.timestamp < 100 * this.config.getConstants(block.height).blocktime
  }

  /**
   * [getState description]
   * @return {[type]} [description]
   */
  getState () {
    return stateMachine.state
  }

  /**
   * [getNetworkInterface description]
   * @return {[type]} [description]
   */
  getNetworkInterface () {
    return pluginManager.get('p2p')
  }

  /**
   * [getTransactionHandler description]
   * @return {[type]} [description]
   */
  getTransactionHandler () {
    return pluginManager.get('transaction-handler')
  }

  /**
   * [getDatabaseConnection description]
   * @return {[type]} [description]
   */
  getDatabaseConnection () {
    return pluginManager.get('database')
  }

  /**
   * [__setupProcessQueue description]
   * @return {[type]} [description]
   */
  __setupProcessQueue () {
    this.processQueue = async.queue(
      (block, qcallback) => this.processBlock(new Block(block), stateMachine.state, qcallback),
      1
    )

    this.processQueue.drain = () => this.dispatch('PROCESSFINISHED')
  }

  /**
   * [__setupRebuildQueue description]
   * @return {[type]} [description]
   */
  __setupRebuildQueue () {
    this.rebuildQueue = async.queue(
      (block, qcallback) => this.rebuildQueue.paused ? qcallback() : this.rebuildBlock(new Block(block), stateMachine.state, qcallback),
      1
    )

    this.rebuildQueue.drain = () => this.dispatch('REBUILDFINISHED')
  }
}
