const async = require('async')
const arkjs = require('arkjs')
const Block = require('../model/block')
const db = require('./db')
const logger = require('./logger')

let instance = null

class BlockchainManager {
  constructor (config) {
    if (!instance) instance = this
    else throw new Error('Can\'t initialise 2 blockchains!')
    this.config = config
    this.monitoring = false
    this.fastRebuild = true
    this.lastBlock = null
    this.processQueue = async.queue((block, qcallback) => this.processBlock(new Block(block), this.fastRebuild, qcallback), 1)
    const that = this
    this.downloadQueue = async.queue(
      (block, qcallback) => {
        that.lastPushedBlock = block
        that.processQueue.push(block)
        qcallback()
      },
      1
    )
    this.downloadQueue.drain = () => {
      logger.info('Block Process Queue Size', that.processQueue.length())
      this.syncWithNetwork({data: this.lastPushedBlock})
    }
    this.processQueue.drain = () => this.finishedNetworkSync()

    if (!instance) instance = this
  }

  static getInstance () {
    return instance
  }

  postBlock (block) {
    this.processQueue.push(block)
  }

  finishedNetworkSync () {
    if (this.isSynced(this.lastBlock)) {
      logger.info('Rebuild has been completed to', this.lastBlock.data.height)
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
      .then((block) => {
        if (!block) {
          return Promise.reject(new Error('No block found in database'))
        }
        that.lastBlock = block
        if (block.data.height === 1) {
          return db
            .buildAccounts()
            .then(() => db.applyRound(block, that.fastRebuild))
            .then(() => block)
        }
        return db
          .buildAccounts()
          .then(() => block)
      })
      .catch((error) => {
        logger.debug(error)
        let genesis = new Block(that.config.genesisBlock)
        if (genesis.data.payloadHash === that.config.network.nethash) {
          that.lastBlock = genesis
          return db.saveBlock(genesis)
            .then(() => db.buildAccounts())
            .then(() => db.applyRound(genesis))
            .then(() => genesis)
        }
        return Promise.reject(new Error('Can\'t use genesis block'), genesis)
      })
  }

  processBlock (block, fastRebuild, qcallback) {
    // logger.info('Processing block', block.verification)
    if (block.verification.verified) {
      if (block.data.previousBlock === this.lastBlock.data.id && ~~(block.data.timestamp / 8) > ~~(this.lastBlock.data.timestamp / 8)) {
        const that = this
        db.applyBlock(block, fastRebuild)
          .then(() => {
            db.saveBlock(block)
            logger.debug('Added new block at height', block.data.height)
            that.lastBlock = block
            qcallback()
          })
          .catch((error) => {
            logger.error(error)
            logger.debug('Refused new block', block.data)
            qcallback()
          })
      } else if (block.data.height > this.lastBlock.data.height + 1) {
        // requeue it (was not received in right order)
        this.processQueue.push(block.data)
        qcallback()
      }
    }
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
      return this.networkInterface.downloadBlocks(block.data.height).then((blocks) => {
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

  sleep (ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }
}

module.exports = BlockchainManager
