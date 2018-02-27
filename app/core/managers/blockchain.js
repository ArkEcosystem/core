const async = require('async')
const arkjs = require('arkjs')
const Block = require('app/models/block')
const logger = require('app/core/logger')
const stateMachine = require('app/core/state-machine')
const threads = require('threads')
const Redis = require('ioredis')
const redis = new Redis()

const sleep = require('app/utils/sleep')

let instance = null

module.exports = class BlockchainManager {
  constructor (config) {
    if (!instance) instance = this
    else throw new Error('Can\'t initialise 2 blockchains!')
    const that = this
    this.config = config
    this.transactionQueue = threads.spawn('app/core/transaction-queue.js')
    this.transactionQueue.send({event: 'init', data: config})

    this.actions = stateMachine.actionMap(this)

    this.processQueue = async.queue(
      (block, qcallback) => this.processBlock(new Block(block), stateMachine.state, qcallback),
      1
    )

    this.downloadQueue = async.queue(
      (block, qcallback) => {
        if (that.downloadQueue.paused) return qcallback()
        that.processQueue.push(block)
        return qcallback()
      },
      1
    )

    this.processQueue.drain = () => this.dispatch('PROCESSFINISHED')

    this.downloadQueue.drain = () => this.dispatch('DOWNLOADED')

    if (!instance) instance = this
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
    if (stateMachine.state.started) {
      return true
    }

    await sleep(10000)

    return this.isReady()
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
    await this.pauseQueues()
    await this.clearQueues()

    stateMachine.state = {
      blockchain: stateMachine.initialState,
      started: false,
      lastBlock: null,
      lastDownloadedBlock: null
    }

    await this.resumeQueues()

    return this.start()
  }

  postTransactions (transactions) {
    logger.info(`Received ${transactions.length} new transactions`)
    return this.transactionQueue.send({event: 'addTransactions', data: transactions})
  }

  postBlock (block) {
    logger.info(`Received new block at height ${block.height} with ${block.numberOfTransactions} transactions`)
    this.downloadQueue.push(block)
  }

  async removeBlocks (nblocks) {
    logger.info(`Starting ${nblocks} blocks undo from height ${stateMachine.state.lastBlock.data.height}`)
    await this.pauseQueues()
    await this.__removeBlocks(nblocks)
    await this.clearQueues()
    await this.resumeQueues()
  }

  async __removeBlocks (nblocks) {
    if (!nblocks) return

    logger.info(`Undoing block ${stateMachine.state.lastBlock.data.height}`)

    await this.undoLastBlock()

    return this.__removeBlocks(nblocks - 1)
  }

  async undoLastBlock () {
    const lastBlock = stateMachine.state.lastBlock

    await this.db.undoBlock(lastBlock)
    await this.db.deleteBlock(lastBlock)
    await this.transactionQueue.send({event: 'undoBlock', data: lastBlock})

    const newLastBlock = await this.db.getBlock(lastBlock.data.previousBlock)
    stateMachine.state.lastBlock = newLastBlock

    return (stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock)
  }

  async pauseQueues () {
    this.downloadQueue.pause()
    this.processQueue.pause()
  }

  async clearQueues () {
    this.downloadQueue.remove(() => true)
    stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock
    this.processQueue.remove(() => true)
  }

  async resumeQueues () {
    this.downloadQueue.resume()
    this.processQueue.resume()
  }

  async processBlock (block, state, qcallback) {
    if (block.verification.verified) {
      const constants = this.config.getConstants(block.data.height)
      // no fast rebuild if in last round
      state.rebuild = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!this.config.server.fastRebuild && !this.config.server.test
      if (block.data.previousBlock === stateMachine.state.lastBlock.data.id && ~~(block.data.timestamp / constants.blocktime) > ~~(stateMachine.state.lastBlock.data.timestamp / constants.blocktime)) {
        try {
          await this.db.applyBlock(block, state.rebuild, state.fastRebuild)
          await this.db.saveBlock(block) // should we save block first, this way we are sure the blockchain is enforced (unicity of block id and transactions id)?
          state.lastBlock = block
          this.transactionQueue.send({event: 'addBlock', data: block})
          qcallback()
        } catch (error) {
          logger.error(error)
          logger.debug(`Refused new block ${block.data}`)
          state.lastDownloadedBlock = state.lastBlock
          this.dispatch('FORK')
          qcallback()
        }
      } else if (block.data.height > state.lastBlock.data.height + 1) {
        // requeue it (was not received in right order)
        // this.processQueue.push(block.data)
        logger.info(`Block disregarded because blockchain not ready to accept it ${block.data.height} lastBlock ${state.lastBlock.data.height}`)
        state.lastDownloadedBlock = state.lastBlock
        qcallback()
      } else if (block.data.height < state.lastBlock.data.height || (block.data.height === state.lastBlock.data.height && block.data.id === state.lastBlock.data.id)) {
        logger.debug('Block disregarded because already in blockchain')
        qcallback()
      } else {
        // TODO: manage fork here
        this.dispatch('FORK')
        logger.info('Block disregarded because on a fork')
        qcallback()
      }
    } else {
      logger.warn('Block disregarded because verification failed. Might be a tentative to hack the network 💣')
      qcallback()
    }
  }

  async getUnconfirmedTransactions (blockSize) {
    return redis.lrange('ark:tx_pool', 0, blockSize - 1)
  }

  isSynced (block) {
    block = block || stateMachine.state.lastBlock.data
    return arkjs.slots.getTime() - block.timestamp < 3 * this.config.getConstants(block.height).blocktime
  }

  attachNetworkInterface (networkInterface) {
    this.networkInterface = networkInterface
    return this
  }

  attachDBInterface (dbinterface) {
    this.db = dbinterface
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
}
