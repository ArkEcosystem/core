const async = require('async')
const arkjs = require('arkjs')
const Block = require('../../models/block')
const logger = require('../logger')
const stateMachine = require('../state-machine')
const sleep = require('../../utils/sleep')

let instance = null

module.exports = class BlockchainManager {
  constructor (config, networkStart) {
    if (!instance) instance = this
    else throw new Error('Can\'t initialise 2 blockchains!')

    this.config = config

    // flag to force a network start
    stateMachine.state.networkStart = !!networkStart
    if (stateMachine.state.networkStart) {
      logger.warning('Arkchain is launched in Genesis Network Start. Unless you know what you are doing, this is likely wrong.')
      logger.info('Starting arkchain for a new world, welcome aboard 🚀 🚀 🚀 🚀 🚀 🚀')
    }

    this.actions = stateMachine.actionMap(this)

    this.processQueue = async.queue(
      (block, qcallback) => this.processBlock(new Block(block), stateMachine.state, qcallback),
      1
    )

    this.rebuildQueue = async.queue(
      (block, qcallback) => this.rebuildQueue.paused ? qcallback() : this.rebuildBlock(new Block(block), stateMachine.state, qcallback),
      1
    )

    this.processQueue.drain = () => this.dispatch('PROCESSFINISHED')
    this.rebuildQueue.drain = () => this.dispatch('REBUILDFINISHED')
  }

  dispatch (event) {
    const nextState = stateMachine.transition(stateMachine.state.blockchain, event)
    logger.debug(`event '${event}': ${JSON.stringify(stateMachine.state.blockchain.value)} -> ${JSON.stringify(nextState.value)} -> actions: ${JSON.stringify(nextState.actions)}`)
    stateMachine.state.blockchain = nextState
    nextState.actions.forEach(actionKey => {
      const action = this.actions[actionKey]
      if (action) return setTimeout(() => action.call(this, event), 0)
      logger.error(`No action ${actionKey} found`)
    })
  }

  start () {
    this.dispatch('START')
  }

  async isReady () {
    while (!stateMachine.state.started) await sleep(1000)
    return true
  }

  static getInstance () {
    return instance
  }

  checkNetwork () {
  }

  updateNetworkStatus () {
  }

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

  postTransactions (transactions) {
    logger.info(`Received ${transactions.length} new transactions`)
    return this.transactionPool.addTransactions(transactions)
  }

  postBlock (block) {
    logger.info(`Received new block at height ${block.height} with ${block.numberOfTransactions} transactions`)
    if (stateMachine.state.started) {
      this.processQueue.push(block)
      stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock
    } else logger.info('Block disregarded because blockchain is not ready')
  }

  async removeBlocks (nblocks) {
    const undoLastBlock = async () => {
      const lastBlock = stateMachine.state.lastBlock
      await this.db.undoBlock(lastBlock)
      await this.db.deleteBlock(lastBlock)
      await this.transactionPool.undoBlock(lastBlock)
      const newLastBlock = await this.db.getBlock(lastBlock.data.previousBlock)
      stateMachine.state.lastBlock = newLastBlock
      return (stateMachine.state.lastDownloadedBlock = newLastBlock)
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

  async pauseQueues () {
    this.rebuildQueue.pause()
    this.processQueue.pause()
  }

  async clearQueues () {
    this.rebuildQueue.remove(() => true)
    stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock
    this.processQueue.remove(() => true)
  }

  async resumeQueues () {
    this.rebuildQueue.resume()
    this.processQueue.resume()
  }

  isChained (block, nextBlock) {
    return nextBlock.data.previousBlock === block.data.id && nextBlock.data.timestamp > block.data.timestamp && nextBlock.data.height === block.data.height + 1
  }

  async rebuildBlock (block, state, qcallback) {
    if (block.verification.verified) {
      if (this.isChained(state.lastBlock, block)) {
        // save block on database
        await this.db.saveBlockAsync(block)
        // committing to db every 10,000 blocks
        if (block.data.height % 10000 === 0) await this.db.saveBlockCommit()
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
      logger.warning('Block disregarded because verification failed. Tentative to hack the network 💣')
      qcallback()
    }
  }

  async processBlock (block, state, qcallback) {
    if (!block.verification.verified) {
      logger.warning('Block disregarded because verification failed. Tentative to hack the network 💣')
      return qcallback()
    }
    if (this.isChained(state.lastBlock, block)) await this.acceptChainedBlock(block, state)
    else await this.manageUnchainedBlock(block, state)
    qcallback()
  }

  async acceptChainedBlock (block, state) {
    try {
      await this.db.applyBlock(block)
      await this.db.saveBlock(block)
      state.lastBlock = block
      // broadcast only recent blocks
      if (arkjs.slots.getTime() - block.data.timestamp < 10) this.networkInterface.broadcastBlock(block)
      this.transactionPool.removeForgedBlock(block.transactions)
    } catch (error) {
      logger.error(error.stack)
      logger.error(`Refused new block: ${JSON.stringify(block.data)}`)
      this.dispatch('FORK')
    }
    state.lastDownloadedBlock = state.lastBlock
  }

  async manageUnchainedBlock (block, state) {
    if (block.data.height > state.lastBlock.data.height + 1) logger.info(`blockchain not ready to accept new block at height ${block.data.height}, lastBlock ${state.lastBlock.data.height}`)
    else if (block.data.height < state.lastBlock.data.height) logger.debug('Block disregarded because already in blockchain')
    else if (block.data.height === state.lastBlock.data.height && block.data.id === state.lastBlock.data.id) logger.debug('Block just received')
    else {
      const isValid = await this.db.validateForkedBlock(block)
      if (isValid) this.dispatch('FORK')
      else logger.info(`Forked block disregarded because it is not allowed to forge, looks like an attack by delegate ${block.data.generatorPublicKey} 💣`)
    }
  }

  async getUnconfirmedTransactions (blockSize) {
    let retItems = await this.transactionPool.getUnconfirmedTransactions(0, blockSize) // [0, 49] return max 50 tx for forging
    return {
      transactions: retItems,
      poolSize: await this.transactionPool.getPoolSize(),
      count: retItems ? retItems.length : -1
    }
  }

  isSynced (block) {
    block = block || stateMachine.state.lastBlock.data
    return arkjs.slots.getTime() - block.timestamp < 3 * this.config.getConstants(block.height).blocktime
  }

  isBuildSynced (block) {
    block = block || stateMachine.state.lastBlock.data
    logger.info(arkjs.slots.getTime() - block.timestamp)
    return arkjs.slots.getTime() - block.timestamp < 100 * this.config.getConstants(block.height).blocktime
  }

  attachNetworkInterface (networkInterface) {
    this.networkInterface = networkInterface
    return this
  }

  attachDBInterface (dbinterface) {
    this.db = dbinterface
    return this
  }

  attachTransactionPool (txPool) {
    this.transactionPool = txPool
    return this
  }

  getState () {
    return stateMachine.state
  }

  getNetworkInterface () {
    return this.networkInterface
  }

  getDb () {
    return this.db
  }

  getTxPool () {
    return this.transactionPool
  }
}
