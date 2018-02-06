const async = require('async')
const arkjs = require('arkjs')
const Block = require('app/models/block')
const goofy = require('app/core/goofy')
const stateMachine = require('app/core/stateMachine')
const PromiseWorker = require('app/core/promise-worker')
const Worker = require('tiny-worker')
const worker = new Worker('app/core/transactionPool.js')

let instance = null
let db = null

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
      lastBlock: null,
      lastDownloadedBlock: null
    }

    this.processQueue = async.queue(
      (block, qcallback) => this.processBlock(new Block(block), this.state, qcallback),
      1
    )

    this.downloadQueue = async.queue(
      (block, qcallback) => {
        if (that.downloadQueue.paused) return qcallback()
        that.state.lastDownloadedBlock = {data: block}
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
    goofy.debug(event)
    const nextState = stateMachine.transition(this.state.blockchain, event)
    // goofy.debug(nextState.value)
    // goofy.debug(nextState.actions)
    this.state.blockchain = nextState.value
    Promise.all(nextState.actions.map(actionKey => {
      const action = this[actionKey]
      if (action) return setTimeout(() => action.call(this, event), 0)
      else goofy.error(`No action ${actionKey} found`)
    }))
  }

  start () {
    this.dispatch('START')
  }

  init () {
    const that = this
    return db.getLastBlock()
      .then(block => {
        if (!block) {
          return Promise.reject(new Error('No block found in database'))
        }
        that.state.lastBlock = block
        const constants = that.config.getConstants(block.data.height)
        // no fast rebuild if in last round
        that.state.fastSync = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!that.config.server.fastSync
        goofy.info('Fast Sync:', that.state.fastSync)
        goofy.info('Last block in database:', block.data.height)
        if (block.data.height === 1) {
          return db
            .buildWallets()
            .then(() => that.transactionPool.postMessage({event: 'start', data: db.walletManager.getLocalWallets()}))
            .then(() => db.saveWallets(true))
            .then(() => db.applyRound(block, false, false))
            .then(() => this.dispatch('SUCCESS'))
        } else {
          return db
            .buildWallets()
            .then(() => that.transactionPool.postMessage({event: 'start', data: db.walletManager.getLocalWallets()}))
            .then(() => db.saveWallets(true))
            .then(() => this.dispatch('SUCCESS'))
        }
      })
      .catch((error) => {
        goofy.info(error.message)
        let genesis = new Block(that.config.genesisBlock)
        if (genesis.data.payloadHash === that.config.network.nethash) {
          that.state.lastBlock = genesis
          that.state.fastSync = true
          goofy.info('Fast Rebuild:', that.state.fastSync)
          return db.saveBlock(genesis)
            .then(() => db.buildWallets())
            .then(() => db.saveWallets(true))
            .then(() => db.applyRound(genesis))
            .then(() => this.dispatch('SUCCESS'))
        }
        return this.dispatch('FAILURE')
      })
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
        lastBlock: null,
        lastDownloadedBlock: null,
        // TODO: revise all these switches
        downloading: false,
        rebuilding: false,
        syncing: false,
        fastSync: true,
        noblock: 0,
        forked: false
      }))
      .then(() => this.init())
      .then(() => this.resumeQueues())
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
    return db.undoBlock(lastBlock)
      .then(() => db.deleteBlock(lastBlock))
      .then(() => this.transactionPool.postMessage({event: 'undoBlock', data: lastBlock}))
      .then(() => db.getBlock(lastBlock.data.previousBlock))
      .then(newLastBlock => (this.state.lastBlock = newLastBlock))
  }

  pauseQueues () {
    this.downloadQueue.pause()
    this.processQueue.pause()
    return Promise.resolve()
  }

  clearQueues () {
    this.downloadQueue.remove(() => true)
    this.state.lastDownloadedBlock = this.state.lastBlock.data
    this.processQueue.remove(() => true)
    return Promise.resolve()
  }

  resumeQueues () {
    this.downloadQueue.resume()
    this.processQueue.resume()
    return Promise.resolve()
  }

  monitorNetwork () {
    return sleep(60000).then(() => this.dispatch('WAKEUP'))
  }

  processBlock (block, state, qcallback) {
    if (block.verification.verified) {
      const constants = this.config.getConstants(block.data.height)
      // no fast rebuild if in last round
      state.fastSync = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!this.config.server.fastSync
      if (block.data.previousBlock === this.state.lastBlock.data.id && ~~(block.data.timestamp / constants.blocktime) > ~~(this.state.lastBlock.data.timestamp / constants.blocktime)) {
        db.applyBlock(block, !state.fastSync, state.fastSync)
          .then(() => db.saveBlock(block))
          .then(() => (state.lastBlock = block))
          // .then(() => this.transactionPool.postMessage({event: 'addBlock', data: block}))
          .then(() => qcallback())
          .catch(error => {
            goofy.error(error)
            goofy.debug('Refused new block', block.data)
            state.lastDownloadedBlock = state.lastBlock.data
            this.dispatch('FORK')
            qcallback()
          })
      } else if (block.data.height > state.lastBlock.data.height + 1) {
        // requeue it (was not received in right order)
        // this.processQueue.push(block.data)
        goofy.info('Block disregarded because blockchain not ready to accept it', block.data.height, 'lastBlock', state.lastBlock.data.height)
        state.lastDownloadedBlock = state.lastBlock
        qcallback()
      } else if (block.data.height < state.lastBlock.data.height) {
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

  checkSynced () {
    // TODO: move to config how many blocktime from current slot is considered 'in synced'
    const isSynced = arkjs.slots.getTime() - this.state.lastBlock.data.timestamp < 3 * this.config.getConstants(this.state.lastBlock.data.height).blocktime
    this.dispatch(isSynced ? 'SYNCED' : 'NOTSYNCED')
  }

  syncingFinished () {
    goofy.info('Node Synced, congratulations! 🦄')
    this.dispatch('SYNCFINISHED')
  }

  triggerDownloadBlocks () {
    const block = this.state.lastDownloadedBlock || this.state.lastBlock
    const that = this
    return this.networkInterface.downloadBlocks(block.data.height).then(blocks => {
      if (!blocks || blocks.length === 0) {
        this.dispatch('NOBLOCK')
      } else {
        goofy.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)
        if (blocks.length && blocks[0].previousBlock === block.data.id) {
          that.downloadQueue.push(blocks)
        } else {
          this.dispatch('FORK')
        }
      }
    })
  }

  attachNetworkInterface (networkInterface) {
    this.networkInterface = networkInterface
    return this
  }

  attachDBInterface (dbinterface) {
    db = dbinterface
    return this
  }

  getDb () {
    return db
  }
}
