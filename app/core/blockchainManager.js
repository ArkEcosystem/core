const async = require('async')
const arkjs = require('arkjs')
const Block = require('app/models/block')
const goofy = require('app/core/goofy')
const stateMachine = require('app/core/stateMachine')
const PromiseWorker = require('app/core/promise-worker')
const Worker = require('tiny-worker')
const worker = new Worker('app/core/transactionPool.js')

let instance = null

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

module.exports = class BlockchainManager {
  constructor (config) {
    if (!instance) instance = this
    else throw new Error('Can\'t initialise 2 blockchains!')
    const that = this
    this.config = config
    this.transactionPool = new PromiseWorker(worker)
    this.transactionPool.postMessage({event: 'init', data: config})
    this.state = {
      blockchain: stateMachine.initialState,
      started: false,
      lastBlock: null,
      lastDownloadedBlock: null
    }

    this.actions = stateMachine.actionMap(this)

    this.processQueue = async.queue(
      (block, qcallback) => this.processBlock(new Block(block), this.state, qcallback),
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
    const nextState = stateMachine.transition(this.state.blockchain, event)
    goofy.debug(`event '${event}': ${JSON.stringify(this.state.blockchain.value)} -> ${JSON.stringify(nextState.value)}`)
    goofy.debug('| actions:', JSON.stringify(nextState.actions))
    this.state.blockchain = nextState
    nextState.actions.forEach(actionKey => {
      const action = this.actions[actionKey]
      if (action) return setTimeout(() => action.call(this, event), 0)
      else goofy.error(`No action ${actionKey} found`)
    })
  }

  start () {
    this.dispatch('START')
  }

  isReady () {
    if (this.state.started) return Promise.resolve(true)
    else return sleep(10000).then(() => this.isReady())
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

  resetState () {
    return this.pauseQueues()
      .then(() => this.clearQueues())
      .then(() => (this.state = {
        blockchain: stateMachine.initialState,
        started: false,
        lastBlock: null,
        lastDownloadedBlock: null
      }))
      .then(() => this.resumeQueues())
      .then(() => this.start())
  }

  postTransactions (transactions) {
    goofy.info('Received new transactions', transactions.map(transaction => transaction.id))
    return this.transactionPool.postMessage({event: 'addTransactions', data: transactions})
  }

  postBlock (block) {
    goofy.info('Received new block at height', block.height)
    this.downloadQueue.push(block)
  }

  removeBlocks (nblocks) {
    goofy.info(`Starting ${nblocks} blocks undo from height`, this.state.lastBlock.data.height)
    return this.pauseQueues()
      .then(() => this.__removeBlocks(nblocks))
      .then(() => this.clearQueues())
      .then(() => this.resumeQueues())
  }

  __removeBlocks (nblocks) {
    if (!nblocks) return Promise.resolve()
    else {
      goofy.info('Undoing block', this.state.lastBlock.data.height)
      return this
        .undoLastBlock()
        .then(() => this.__removeBlocks(nblocks - 1))
    }
  }

  undoLastBlock () {
    const lastBlock = this.state.lastBlock
    return this.db.undoBlock(lastBlock)
      .then(() => this.db.deleteBlock(lastBlock))
      .then(() => this.transactionPool.postMessage({event: 'undoBlock', data: lastBlock}))
      .then(() => this.db.getBlock(lastBlock.data.previousBlock))
      .then(newLastBlock => (this.state.lastBlock = newLastBlock))
      .then(() => (this.state.lastDownloadedBlock = this.state.lastBlock))
  }

  pauseQueues () {
    this.downloadQueue.pause()
    this.processQueue.pause()
    return Promise.resolve()
  }

  clearQueues () {
    this.downloadQueue.remove(() => true)
    this.state.lastDownloadedBlock = this.state.lastBlock
    this.processQueue.remove(() => true)
    return Promise.resolve()
  }

  resumeQueues () {
    this.downloadQueue.resume()
    this.processQueue.resume()
    return Promise.resolve()
  }

  processBlock (block, state, qcallback) {
    if (block.verification.verified) {
      const constants = this.config.getConstants(block.data.height)
      // no fast rebuild if in last round
      state.fastSync = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!this.config.server.fastSync
      if (block.data.previousBlock === this.state.lastBlock.data.id && ~~(block.data.timestamp / constants.blocktime) > ~~(this.state.lastBlock.data.timestamp / constants.blocktime)) {
        this.db.applyBlock(block, !state.fastSync, state.fastSync)
          .then(() => this.db.saveBlock(block)) // should we save block first, this way we are sure the blockchain is enforced (unicity of block id and transactions id)?
          .then(() => (state.lastBlock = block))
          // .then(() => this.transactionPool.postMessage({event: 'addBlock', data: block}))
          .then(() => qcallback())
          .catch(error => {
            goofy.error(error)
            goofy.debug('Refused new block', block.data)
            state.lastDownloadedBlock = state.lastBlock
            this.dispatch('FORK')
            qcallback()
          })
      } else if (block.data.height > state.lastBlock.data.height + 1) {
        // requeue it (was not received in right order)
        // this.processQueue.push(block.data)
        goofy.info('Block disregarded because blockchain not ready to accept it', block.data.height, 'lastBlock', state.lastBlock.data.height)
        state.lastDownloadedBlock = state.lastBlock
        qcallback()
      } else if (block.data.height < state.lastBlock.data.height || (block.data.height === state.lastBlock.data.height && block.data.id === state.lastBlock.data.id)) {
        goofy.debug('Block disregarded because already in blockchain')
        qcallback()
      } else {
        // TODO: manage fork here
        this.dispatch('FORK')
        goofy.info('Block disregarded because on a fork')
        qcallback()
      }
    } else {
      goofy.warn('Block disregarded because verification failed. Might be a tentative to hack the network 💣')
      qcallback()
    }
  }

  isSynced (block) {
    block = block || this.state.lastBlock.data
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

  getDb () {
    return this.db
  }
}
