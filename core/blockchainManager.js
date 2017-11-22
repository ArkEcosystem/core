const async = require('async')
const arkjs = require('arkjs')
const Block = require('../model/block')
const logger = require('./logger')

let instance = null
let db = null

class BlockchainManager {
  constructor (config) {
    if (!instance) instance = this
    else throw new Error('Can\'t initialise 2 blockchains!')
    const that = this
    this.config = config
    this.monitoring = false
    this.fastRebuild = !!config.server.fastRebuild
    this.lastBlock = null
    this.lastDownloadedBlock = null

    this.processQueue = async.queue(
      (block, qcallback) => this.processBlock(new Block(block), this.fastRebuild, qcallback),
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

    if (!instance) instance = this
  }

  static getInstance () {
    return instance
  }

  postBlock (block) {
    logger.info('Received new block at height', block.height)
    this.processQueue.push(block)
  }

  finishedNetworkSync () {
    if (this.isSynced(this.lastBlock)) {
      if (this.fastRebuild) logger.info('Rebuild has been completed to height', this.lastBlock.data.height)
      else logger.info('Blockchain updated to height', this.lastBlock.data.height)
      this.fastRebuild = false
      return this.startNetworkMonitoring()
    } else {
      return Promise.resolve()
    }
  }

  startNetworkMonitoring () {
    if (this.monitoring) return
    this.monitoring = true
    return this.updateBlockchainFromNetwork()
  }

  updateBlockchainFromNetwork () {
    if (!this.monitoring) return Promise.reject(new Error('stopped by user'))

    return this.networkInterface.updateNetworkStatus()
      .then(() => this.syncWithNetwork(this.lastBlock))
      .then(() => new Promise(resolve => setTimeout(resolve, 60000)))
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
        if (block.data.height === 1) {
          return db
            .buildAccounts()
            .then(() => db.saveAccounts(true))
            .then(() => db.applyRound(block, that.fastRebuild))
            .then(() => block)
        }
        return db
          .buildAccounts()
          .then(() => db.saveAccounts())
          .then(() => block)
      })
      .catch((error) => {
        logger.debug(error)
        let genesis = new Block(that.config.genesisBlock)
        if (genesis.data.payloadHash === that.config.network.nethash) {
          that.lastBlock = genesis
          return db.saveBlock(genesis)
            .then(() => db.buildAccounts())
            .then(() => db.saveAccounts(true))
            .then(() => db.applyRound(genesis))
            .then(() => genesis)
        }
        return Promise.reject(new Error('Can\'t use genesis block'), genesis)
      })
  }

  processBlock (block, fastRebuild, qcallback) {
    if (block.verification.verified) {
      const blocktime = this.config.getConstants(block.data.height).blocktime
      if (block.data.previousBlock === this.lastBlock.data.id && ~~(block.data.timestamp / blocktime) > ~~(this.lastBlock.data.timestamp / blocktime)) {
        const that = this
        db.applyBlock(block, fastRebuild)
          .then(() => db.saveBlock(block))
          .then(() => logger.debug('Added new block at height', block.data.height))
          .then(() => (that.lastBlock = block))
          .then(() => qcallback())
          .catch(error => {
            logger.error(error)
            logger.debug('Refused new block', block.data)
            qcallback()
          })
      } else if (block.data.height > this.lastBlock.data.height + 1) {
        // requeue it (was not received in right order)
        this.processQueue.push(block.data)
      } else {
        // TODO: manage fork here
        logger.info('Block disregarded')
        qcallback()
      }
    }
  }

  undoLastBlock () {
    const lastBlock = this.lastBlock
    return db.undoBlock(lastBlock)
      .then(newLastBlock => (this.lastBlock = newLastBlock))
  }

  isSynced (block) {
    return arkjs.slots.getTime() - block.data.timestamp < 2 * this.config.getConstants(block.data.height).blocktime
  }

  syncWithNetwork (block) {
    block = block || this.lastBlock
    if (this.isSynced(block)) return Promise.resolve()
    if (this.config.server.test) return Promise.resolve()
    const that = this
    if (this.networkInterface) {
      return this.networkInterface.downloadBlocks(block.data.height).then(blocks => {
        if (!blocks || blocks.length === 0) return that.syncWithNetwork(block)
        else {
          logger.info('Downloaded new blocks', blocks.length, 'with', blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0), 'transactions')
          if (blocks.length && blocks[0].previousBlock === block.data.id) that.downloadQueue.push(blocks)
          return Promise.resolve(blocks.length)
        }
      })
    } else return Promise.reject(new Error('No network interface attached'))
  }

  attachNetworkInterface (networkInterface) {
    this.networkInterface = networkInterface
    return this
  }

  attachDBInterface (dbinterface) {
    db = dbinterface
    return this
  }

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = BlockchainManager
