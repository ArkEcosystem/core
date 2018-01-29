const async = require('async')
const arkjs = require('arkjs')
const Block = require('../model/block')
const logger = require('./logger')

let instance = null
let db = null

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

module.exports = class BlockchainManager {
  constructor (config) {
    if (!instance) instance = this
    else throw new Error('Can\'t initialise 2 blockchains!')
    const that = this
    this.config = config
    this.status = {
      lastBlock: null,
      lastDownloadedBlock: null,
      downloadpaused: false,
      rebuild: false,
      syncing: false,
      fastSync: true,
      noblock: 0,
      forked: false
    }

    this.eventQueue = async.queue(
      (event, qcallback) => this.processEvent(event, qcallback),
      1
    )

    this.processQueue = async.queue(
      (block, qcallback) => this.processBlock(new Block(block), this.status, qcallback),
      1
    )

    this.downloadQueue = async.queue(
      (block, qcallback) => {
        if (that.downloadQueue.paused) return qcallback()
        that.status.lastDownloadedBlock = block
        that.processQueue.push(block)
        return qcallback()
      },
      1
    )

    this.processQueue.drain = () => this.eventQueue.push({type: 'processQueue/stop'})

    this.downloadQueue.drain = () => this.eventQueue.push({type: 'downloadQueue/stop'})

    if (!instance) instance = this
  }

  init () {
    const that = this
    return db.getLastBlock()
      .then(block => {
        if (!block) {
          return Promise.reject(new Error('No block found in database'))
        }
        that.status.lastBlock = block
        const constants = that.config.getConstants(block.data.height)
        // no fast rebuild if in last round
        that.status.fastSync = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!that.config.server.fastSync
        logger.info('Fast Sync:', that.status.fastSync)
        logger.info('Last block in database:', block.data.height)
        if (block.data.height === 1) {
          return db
            .buildAccounts()
            .then(() => db.saveAccounts(true))
            .then(() => db.applyRound(block, false, false))
            .then(() => block)
        } else {
          return db
            .buildAccounts()
            .then(() => db.saveAccounts(true))
            .then(() => block)
        }
      })
      .catch((error) => {
        logger.debug(error)
        let genesis = new Block(that.config.genesisBlock)
        if (genesis.data.payloadHash === that.config.network.nethash) {
          that.status.lastBlock = genesis
          that.status.fastSync = true
          logger.info('Fast Rebuild:', that.status.fastSync)
          return db.saveBlock(genesis)
            .then(() => db.buildAccounts())
            .then(() => db.saveAccounts(true))
            .then(() => db.applyRound(genesis))
            .then(() => genesis)
        }
        return Promise.reject(new Error('Can\'t use genesis block'), genesis)
      })
  }

  static getInstance () {
    return instance
  }

  start () {
    this.monitorNetwork()
    return Promise.resolve()
  }

  checkNetwork () {
    this.eventQueue.push({type: 'check'})
  }

  updateNetworkStatus () {
    this.eventQueue.push({type: 'updateNetworkStatus'})
  }

  rebuild (nblocks) {
    this.eventQueue.push({type: 'rebuild/start', nblocks: nblocks || 1})
  }

  resetState () {
    return this.pauseQueues()
      .then(() => this.clearQueues())
      .then(() => (this.status = {
        lastBlock: null,
        lastDownloadedBlock: null,
        downloadpaused: false,
        rebuild: false,
        syncing: false,
        fastSync: true,
        noblock: 0,
        forked: false
      }))
      .then(() => this.init())
      .then(() => this.resumeQueues())
  }

  processEvent (event, qcallback) {
    logger.debug(`event ${event.type}`)
    switch (event.type) {
      case 'check':
        if (this.isSynced(this.status.lastBlock)) {
          this.status.syncing = false
          logger.info('Node Synced, congratulations! 🦄')
        } else {
          this.status.noblock = 0
          this.eventQueue.push({type: 'sync/start'})
        }
        return qcallback()
      case 'broadcast':
        this.networkInterface.broadcastBlock(event.block)
        return qcallback()
      case 'updateNetworkStatus':
        return this.networkInterface.updateNetworkStatus().then(() => qcallback())
      case 'downloadQueue/stop':
        if (!this.isSynced({data: this.status.lastDownloadedBlock})) this.eventQueue.push({type: 'download/next', noblock: false})
        return qcallback()
      case 'processQueue/stop':
        if (!this.isSynced(this.status.lastBlock)) this.eventQueue.push({type: 'sync/start'})
        else {
          this.status.syncing = false
          logger.info('Node Synced, congratulations! 🦄')
        }
        return qcallback()
      case 'rebuild/start':
        if (!this.status.rebuild) {
          this.status.rebuild = true
          this.status.syncing = false
          this.status.downloadpaused = true
          this.removeBlocks(event.nblocks).then((status) => qcallback())
        } else return qcallback()
        break
      case 'rebuild/stop':
        this.status.rebuild = false
        this.eventQueue.push({type: 'sync/start'})
        return qcallback()
      case 'sync/start':
        logger.debug(JSON.stringify(this.status))
        if (this.config.server.test) return qcallback()
        if (!this.status.rebuild && !this.status.syncing) {
          logger.info('Syncing started')
          this.status.syncing = true
          this.status.lastDownloadedBlock = this.status.lastBlock.data
          this.status.downloadpaused = false
          return this.syncWithNetwork({data: this.status.lastDownloadedBlock}).then((status) => qcallback())
        } else return qcallback()
      case 'download/pause':
        this.status.downloadpaused = true
        return qcallback()
      case 'download/next':
        if (this.processQueue.length() > 10000) {
          this.status.downloadpaused = true
          return qcallback()
        }
        if (this.status.downloadpaused) {
          logger.info('Download paused')
          return qcallback()
        } else {
          if (event.noblock) this.status.noblock++
          else this.status.noblock = 0
          if (this.status.noblock < 5) return this.syncWithNetwork({data: this.status.lastDownloadedBlock}).then((status) => qcallback())
          else {
            this.status.syncing = false
            logger.warn('Node looks synced with network, but either local time is drifted or the network is missing blocks 🤔')
            this.config.ntp().then(time => logger.info('Local clock is off by ' + parseInt(time.t) + 'ms from NTP ⏰'))
            return qcallback()
          }
        }
      case 'sync/stop':
        qcallback()
        break
      default:
        logger.error('Event unknown', event)
        qcallback()
    }
  }

  postBlock (block) {
    logger.info('Received new block at height', block.height)
    this.downloadQueue.push(block)
  }

  removeBlocks (nblocks) {
    logger.info(`Starting ${nblocks} blocks undo from height`, this.status.lastBlock.data.height)
    return this.pauseQueues()
      .then(() => this.__removeBlocks(nblocks))
      .then(() => this.clearQueues())
      .then(() => this.resumeQueues())
      .then(() => this.eventQueue.push({type: 'rebuild/stop'}))
  }

  __removeBlocks (nblocks) {
    if (!nblocks) return Promise.resolve()
    else {
      logger.info('Undoing block', this.status.lastBlock.data.height)
      return this
        .undoLastBlock()
        .then(() => this.__removeBlocks(nblocks - 1))
    }
  }

  undoLastBlock () {
    const lastBlock = this.status.lastBlock
    return db.undoBlock(lastBlock)
      .then(() => db.deleteBlock(lastBlock))
      .then(() => db.getBlock(lastBlock.data.previousBlock))
      .then(newLastBlock => (this.status.lastBlock = newLastBlock))
  }

  pauseQueues () {
    this.downloadQueue.pause()
    this.processQueue.pause()
    return Promise.resolve()
  }

  clearQueues () {
    this.downloadQueue.remove(() => true)
    this.status.lastDownloadedBlock = this.status.lastBlock.data
    this.processQueue.remove(() => true)
    return Promise.resolve()
  }

  resumeQueues () {
    this.downloadQueue.resume()
    this.processQueue.resume()
    return Promise.resolve()
  }

  monitorNetwork () {
    this.eventQueue.push({type: 'check'})
    return sleep(60000).then(() => this.monitorNetwork())
  }

  processBlock (block, status, qcallback) {
    if (block.verification.verified) {
      const constants = this.config.getConstants(block.data.height)
      // no fast rebuild if in last round
      status.fastSync = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!this.config.server.fastSync
      if (block.data.previousBlock === this.status.lastBlock.data.id && ~~(block.data.timestamp / constants.blocktime) > ~~(this.status.lastBlock.data.timestamp / constants.blocktime)) {
        db.applyBlock(block, status.syncing, status.fastSync)
          .then(() => db.saveBlock(block))
          .then(() => (status.lastBlock = block))
          .then(() => qcallback())
          .catch(error => {
            logger.error(error)
            logger.debug('Refused new block', block.data)
            status.lastDownloadedBlock = status.lastBlock.data
            qcallback()
          })
      } else if (block.data.height > status.lastBlock.data.height + 1) {
        // requeue it (was not received in right order)
        // this.processQueue.push(block.data)
        logger.info('Block disregarded because blockchain not ready to accept it', block.data.height, 'lastBlock', status.lastBlock.data.height)
        status.lastDownloadedBlock = status.lastBlock.data;
        ['updateNetworkStatus', 'sync/start'].forEach(type => this.eventQueue.push({type: type}))
        qcallback()
      } else if (block.data.height < status.lastBlock.data.height) {
        logger.info('Block disregarded because already in blockchain')
        qcallback()
      } else {
        // TODO: manage fork here
        status.forked = true
        logger.info('Block disregarded because on a fork')
        qcallback()
      }
    } else {
      logger.warn('Block disregarded because verification failed. Might be a tentative to hack the network 💣')
      qcallback()
    }
  }

  isSynced (block) {
    // TODO: move to config how many blocktime from current slot is considered 'in synced'
    return arkjs.slots.getTime() - block.data.timestamp < 3 * this.config.getConstants(block.data.height).blocktime
  }

  syncWithNetwork (block) {
    block = block || this.status.lastBlock
    const that = this
    return this.networkInterface.downloadBlocks(block.data.height).then(blocks => {
      if (!blocks || blocks.length === 0) {
        logger.info('No new block found on this peer')
        that.eventQueue.push({type: 'download/next', noblock: true})
      } else {
        logger.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)
        if (blocks.length && blocks[0].previousBlock === block.data.id) that.downloadQueue.push(blocks)
        else { // TODO Fork
          this.eventQueue.push({type: 'rebuild/start', nblocks: 5})
          logger.error('bang')
        }
      }
      return Promise.resolve()
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
