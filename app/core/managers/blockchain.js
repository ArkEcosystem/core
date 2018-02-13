const async = require('async')
const arkjs = require('arkjs')
const Block = require('app/models/block')
const goofy = require('app/core/goofy')
const stateMachine = require('app/core/state-machine')
const PromiseWorker = require('app/core/promise-worker')
const Worker = require('tiny-worker')
const worker = new Worker('app/core/transaction-pool.js')

let instance = null

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

module.exports = class BlockchainManager {
  constructor (config) {
    if (!instance) {
      instance = this
    } else {
      throw new Error('Can\'t initialise 2 blockchains!')
    }

    const that = this
    this.config = config
    this.transactionPool = new PromiseWorker(worker)
    this.transactionPool.postMessage({event: 'init', data: config})

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
    goofy.debug(`event '${event}': ${JSON.stringify(stateMachine.state.blockchain.value)} -> ${JSON.stringify(nextState.value)}`)
    goofy.debug('| actions:', JSON.stringify(nextState.actions))

    stateMachine.state.blockchain = nextState

    nextState.actions.forEach(actionKey => {
      const action = this.actions[actionKey]
      if (action) return setTimeout(() => action.call(this, event), 0)
      else goofy.error(`No action ${actionKey} found`)
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
    goofy.info('Received new transactions', transactions.map(transaction => transaction.id))

    return this.transactionPool.postMessage({event: 'addTransactions', data: transactions})
  }

  postBlock (block) {
    goofy.info('Received new block at height', block.height)

    this.downloadQueue.push(block)
  }

  async removeBlocks (nblocks) {
    goofy.info(`Starting ${nblocks} blocks undo from height`, stateMachine.state.lastBlock.data.height)

    await this.pauseQueues()
    await this.__removeBlocks(nblocks)
    await this.clearQueues()

    return this.resumeQueues()
  }

  async __removeBlocks (nblocks) {
    if (!nblocks) return Promise.resolve()

    goofy.info('Undoing block', stateMachine.state.lastBlock.data.height)

    await this.undoLastBlock()

    this.__removeBlocks(nblocks - 1)
  }

  async undoLastBlock () {
    const lastBlock = stateMachine.state.lastBlock

    await this.db.undoBlock(lastBlock)
    await this.db.deleteBlock(lastBlock)
    await this.transactionPool.postMessage({event: 'undoBlock', data: lastBlock})

    const newLastBlock = await this.db.getBlock(lastBlock.data.previousBlock)
    stateMachine.state.lastBlock = newLastBlock
    stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock
  }

  pauseQueues () {
    this.downloadQueue.pause()
    this.processQueue.pause()

    return Promise.resolve()
  }

  clearQueues () {
    this.downloadQueue.remove(() => true)
    stateMachine.state.lastDownloadedBlock = stateMachine.state.lastBlock
    this.processQueue.remove(() => true)

    return Promise.resolve()
  }

  resumeQueues () {
    this.downloadQueue.resume()
    this.processQueue.resume()

    return Promise.resolve()
  }

  async processBlock (block, state, qcallback) {
    if (block.verification.verified) {
      const constants = this.config.getConstants(block.data.height)
      // no fast rebuild if in last round
      state.rebuild = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!this.config.server.fastRebuild

      if (block.data.previousBlock === stateMachine.state.lastBlock.data.id && ~~(block.data.timestamp / constants.blocktime) > ~~(stateMachine.state.lastBlock.data.timestamp / constants.blocktime)) {
        await this.db.applyBlock(block, state.rebuild, state.fastRebuild)

        await this.db.saveBlock(block) // should we save block first, this way we are sure the blockchain is enforced (unicity of block id and transactions id)?
        state.lastBlock = block

        // await this.transactionPool.postMessage({event: 'addBlock', data: block})

        qcallback()

        // .catch(error => {
        //   goofy.error(error)
        //   goofy.debug('Refused new block', block.data)
        //   state.lastDownloadedBlock = state.lastBlock
        //   this.dispatch('FORK')
        //   qcallback()
        // })
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

  getDb () {
    return this.db
  }
}
