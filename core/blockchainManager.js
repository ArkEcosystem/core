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
    this.monitoring = false
    this.lastBlock = null
    this.lastDownloadedBlock = null
    this.downloadpaused = false

    this.processQueue = async.queue(
      (block, qcallback) => this.processBlock(new Block(block), !this.monitoring, this.fastRebuild, qcallback),
      1
    )
    this.downloadQueue = async.queue(
      (block, qcallback) => {
        that.lastDownloadedBlock = block
        that.processQueue.push(block)
        qcallback()
      },
      1
    )
    this.downloadQueue.drain = () => {
      logger.info('Block Process Queue Size', that.processQueue.length())
      this.syncWithNetwork({data: this.lastDownloadedBlock})
    }
    this.processQueue.drain = () => this.finishedNetworkSync()

    // sleep(60000).then(() => this.testRandomRebuild())

    if (!instance) instance = this
  }

  static getInstance () {
    return instance
  }

  postBlock (block) {
    logger.info('Received new block at height', block.height)
    this.downloadQueue.push(block)
  }

  rebuild () {
    this.stopNetworkMonitoring()
    return this.pauseQueues()
      .then(() => this.undoLastBlock())
      .then(() => this.resumeQueues())
  }

  testRandomRebuild () {
    logger.info('test: undoing one block', this.lastBlock.data.height)
    return this.rebuild()
      .then(() => sleep(1000))
      .then(() => this.testRandomRebuild())
  }

  pauseQueues () {
    this.downloadQueue.pause()
    this.processQueue.pause()
    return Promise.resolve()
  }

  resumeQueues () {
    this.downloadQueue.resume()
    this.processQueue.resume()
    return Promise.resolve()
  }

  finishedNetworkSync () {
    if (this.isSynced(this.lastBlock)) {
      logger.info('Blockchain updated to height', this.lastBlock.data.height)
      this.fastRebuild = false
      return this.startNetworkMonitoring()
    } else if (this.downloadpaused) {
      this.downloadpaused = false
      return this.syncWithNetwork(this.lastBlock)
    } else {
      this.stopNetworkMonitoring()
      return Promise.resolve()
    }
  }

  startNetworkMonitoring () {
    if (this.monitoring) return
    this.monitoring = true
    return this.updateBlockchainFromNetwork()
  }

  updateBlockchainFromNetwork () {
    if (!this.monitoring) return Promise.resolve()

    return this.networkInterface.updateNetworkStatus()
      .then(() => this.syncWithNetwork(this.lastBlock))
      .then(() => sleep(60000))
      .then(() => this.updateBlockchainFromNetwork())
  }

  stopNetworkMonitoring () {
    this.monitoring = false
  }

  init () {
    const that = this
    return db.getLastBlock()
      .then(block => {
        if (!block) {
          return Promise.reject(new Error('No block found in database'))
        }
        that.lastBlock = block
        const constants = that.config.getConstants(block.data.height)
        // no fast rebuild if in last round
        that.fastRebuild = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!that.config.server.fastRebuild
        logger.info('Fast Rebuild:', that.fastRebuild)
        logger.info('Last block in database:', block.data.height)
        if (block.data.height === 1) {
          return db
            .buildAccounts()
            .then(() => db.saveAccounts(true))
            .then(() => db.applyRound(block, that.fastRebuild))
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
          that.lastBlock = genesis
          that.fastRebuild = true
          logger.info('Fast Rebuild:', that.fastRebuild)
          return db.saveBlock(genesis)
            .then(() => db.buildAccounts())
            .then(() => db.saveAccounts(true))
            .then(() => db.applyRound(genesis))
            .then(() => genesis)
        }
        return Promise.reject(new Error('Can\'t use genesis block'), genesis)
      })
  }

  processBlock (block, rebuild, fastRebuild, qcallback) {
    if (block.verification.verified) {
      const constants = this.config.getConstants(block.data.height)
      // no fast rebuild if in last round
      this.fastRebuild = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!this.config.server.fastRebuild
      if (block.data.previousBlock === this.lastBlock.data.id && ~~(block.data.timestamp / constants.blocktime) > ~~(this.lastBlock.data.timestamp / constants.blocktime)) {
        const that = this
        db.applyBlock(block, rebuild, fastRebuild)
          .then(() => db.saveBlock(block))
          .then(() => (that.lastBlock = block))
          .then(() => qcallback())
          .catch(error => {
            logger.error(error)
            logger.debug('Refused new block', block.data)
            that.lastDownloadedBlock = this.lastBlock
            qcallback()
          })
      } else if (block.data.height > this.lastBlock.data.height + 1) {
        // requeue it (was not received in right order)
        // this.processQueue.push(block.data)
        logger.info('Block disregarded because blockchain not ready to accept it')
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

  undoLastBlock () {
    const lastBlock = this.lastBlock
    return db.undoBlock(lastBlock)
      .then(() => db.deleteBlock(lastBlock))
      .then(() => db.getBlock(lastBlock.data.previousBlock))
      .then(newLastBlock => (this.lastBlock = newLastBlock))
  }

  isSynced (block) {
    return arkjs.slots.getTime() - block.data.timestamp < 2 * this.config.getConstants(block.data.height).blocktime
  }

  syncWithNetwork (block) {
    block = block || this.lastBlock
    if (this.isSynced(block)) return Promise.resolve()
    if (this.processQueue.length() > 10000) {
      logger.info('Pausing download blocks to wait for process queue drain')
      this.downloadpaused = true
      return Promise.resolve()
    }
    if (this.config.server.test) return Promise.resolve()
    const that = this
    return this.networkInterface.downloadBlocks(block.data.height).then(blocks => {
      if (!blocks || blocks.length === 0) return that.syncWithNetwork(block)
      else {
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
