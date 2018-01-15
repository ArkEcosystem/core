const async = require('async')
const arkjs = require('arkjs')
const Block = require('../model/block')
const logger = require('./logger')

let instance = null
let db = null

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

class BlockchainManager {
  constructor (config) {
    if (!instance) instance = this
    else throw new Error('Can\'t initialise 2 blockchains!')
    const that = this
    this.config = config
    this.status = {
      monitoring: false,
      lastBlock: null,
      lastDownloadedBlock: null,
      downloadpaused: false,
      rebuild: false,
      fastRebuild: true
    }

    this.eventQueue = async.queue(
      (event, qcallback) => this.processEvent(event, qcallback),
      1
    )

    // this.eventQueue.drain = () => this.continueNetworkSync()

    this.processQueue = async.queue(
      (block, qcallback) => this.processBlock(new Block(block), this.status, qcallback),
      1
    )

    this.downloadQueue = async.queue(
      (block, qcallback) => {
        if (that.downloadQueue.paused || (that.status.lastDownloadedBlock && that.status.lastDownloadedBlock.height !== block.height - 1)) return qcallback()
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

  static getInstance () {
    return instance
  }

  rebuild (nblocks) {
    this.eventQueue.push({type: 'rebuild/start', nblocks: 20})
  }

  processEvent (event, qcallback) {
    logger.debug(`event ${event.type}`)
    switch (event.type) {
      case 'check':
        if (this.isSynced(this.status.lastBlock)) sleep(6000).then(() => this.eventQueue.push({type: 'check'}))
        else this.eventQueue.push({type: 'sync/start'})
        return qcallback()
      case 'downloadQueue/stop':
        if (this.isSynced(this.status.lastBlock)) sleep(6000).then(() => this.eventQueue.push({type: 'check'}))
        else this.eventQueue.push({type: 'download/next'})
        return qcallback()
      case 'processQueue/stop':
        if (this.status.downloadpaused) {
          this.eventQueue.push({type: 'sync/start'})
        }
        return qcallback()
      case 'rebuild/start':
        if (!this.status.rebuild) {
          this.status.rebuild = true
          this.status.downloadpaused = true
          this.removeBlocks(event.nblocks).then((status) => qcallback())
        } else return qcallback()
        break
      case 'rebuild/stop':
        this.status.rebuild = false
        this.eventQueue.push({type: 'sync/start'})
        return qcallback()
      case 'sync/start':
        if (!this.status.rebuild) {
          logger.info('Syncing started')
          this.status.lastDownloadedBlock = this.status.lastBlock.data
          this.status.downloadpaused = false
          return this.syncWithNetwork().then((status) => qcallback())
        } else return qcallback()
      case 'download/pause':
        this.status.downloadpaused = true
        return qcallback()
      case 'download/next':
        if (this.status.downloadpaused) {
          logger.info('Download paused')
          return qcallback()
        } else {
          return this.syncWithNetwork().then((status) => qcallback())
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
    logger.info('Undoing block', this.status.lastBlock.data.height)
    if (nblocks === 0) return Promise.resolve()
    else {
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

  continueNetworkSync () {
    logger.debug('Process queue drained, function continueNetworkSync called at height', this.status.lastBlock.data.height)
    this.status.lastDownloadedBlock = this.status.lastBlock.data
    if (this.isSynced(this.lastBlock)) {
      logger.info('Blockchain updated to height', this.status.lastBlock.data.height)
      this.status.fastRebuild = false
      return this.startNetworkMonitoring()
    } else if (this.status.downloadpaused) {
      logger.info('Download was paused, restarting synchronisation from height', this.status.lastBlock.data.height)
      this.status.downloadpaused = false
      return this.syncWithNetwork(this.status.lastBlock)
    } else {
      logger.debug('Network still syncing, exiting without doing anything')
      return Promise.resolve()
    }
  }

  startNetworkMonitoring () {
    if (this.status.monitoring) return
    this.status.monitoring = true
    return this.updateBlockchainFromNetwork()
  }

  updateBlockchainFromNetwork () {
    if (!this.status.monitoring) return Promise.resolve()

    return this.networkInterface.updateNetworkStatus()
      .then(() => this.syncWithNetwork(this.status.lastBlock))
      .then(() => sleep(60000))
      .then(() => this.updateBlockchainFromNetwork())
  }

  stopNetworkMonitoring () {
    this.status.monitoring = false
    return Promise.resolve(this.monitoring)
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
        that.status.fastRebuild = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!that.config.server.fastRebuild
        logger.info('Fast Rebuild:', that.status.fastRebuild)
        logger.info('Last block in database:', block.data.height)
        if (block.data.height === 1) {
          return db
            .buildAccounts()
            .then(() => db.saveAccounts(true))
            .then(() => db.applyRound(block, that.status.fastRebuild))
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
          that.status.fastRebuild = true
          logger.info('Fast Rebuild:', that.status.fastRebuild)
          return db.saveBlock(genesis)
            .then(() => db.buildAccounts())
            .then(() => db.saveAccounts(true))
            .then(() => db.applyRound(genesis))
            .then(() => genesis)
        }
        return Promise.reject(new Error('Can\'t use genesis block'), genesis)
      })
  }

  processBlock (block, status, qcallback) {
    if (block.verification.verified) {
      const constants = this.config.getConstants(block.data.height)
      // no fast rebuild if in last round
      status.fastRebuild = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!this.config.server.fastRebuild
      if (block.data.previousBlock === this.status.lastBlock.data.id && ~~(block.data.timestamp / constants.blocktime) > ~~(this.status.lastBlock.data.timestamp / constants.blocktime)) {
        db.applyBlock(block, status.rebuild, status.fastRebuild)
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
        status.lastDownloadedBlock = status.lastBlock.data
        qcallback()
      } else {
        // TODO: manage fork here
        logger.info('Block disregarded because on a fork')
        qcallback()
      }
    } else {
      logger.info('Block disregarded because not legit')
      qcallback()
    }
  }

  isSynced (block) {
    // TODO: move to config how many blocktime from current slot is considered 'in synced'
    return arkjs.slots.getTime() - block.data.timestamp < 3 * this.config.getConstants(block.data.height).blocktime
  }

  syncWithNetwork (block) {
    block = block || this.status.lastBlock
    if (this.isSynced(block)) return Promise.resolve(this.status)
    if (this.processQueue.length() > 10000) {
      this.eventQueue.push({type: 'download/pause'})
      return Promise.resolve(this.status)
    }
    if (this.config.server.test) return Promise.resolve()
    const that = this
    return this.networkInterface.downloadBlocks(block.data.height).then(blocks => {
      if (!blocks || blocks.length === 0) {
        logger.info('No new block found on this peer')
        that.eventQueue.push({type: 'download/next'})
        return Promise.resolve(that.status)
      } else {
        logger.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)
        if (blocks.length && blocks[0].previousBlock === block.data.id) that.downloadQueue.push(blocks)
        return Promise.resolve(blocks.length)
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

module.exports = BlockchainManager
