'use strict';

const async = require('async')
const { crypto, slots } = require('@arkecosystem/client')
const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const logger = pluginManager.get('logger')
const WalletManager = require('./wallet-manager')

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class ConnectionInterface {
  /**
   * [constructor description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  constructor (config) {
    this.config = config
    this.connection = null
  }

  /**
   * [getConnection description]
   * @return {[type]} [description]
   */
  getConnection () {
    return this.connection
  }

  /**
   * [connect description]
   * @return {[type]} [description]
   */
  async connect () {
    throw new Error('Method [connect] not implemented!')
  }

  /**
   * [disconnect description]
   * @return {[type]} [description]
   */
  async disconnect () {
    throw new Error('Method [disconnect] not implemented!')
  }

  /**
   * [getActiveDelegates description]
   * @param  {[type]} height [description]
   * @return {[type]}        [description]
   */
  getActiveDelegates (height) {
    throw new Error('Method [getActiveDelegates] not implemented!')
  }

  /**
   * [buildDelegates description]
   * @param  {[type]} maxDelegates [description]
   * @param  {[type]} height       [description]
   * @return {[type]}              [description]
   */
  buildDelegates (maxDelegates, height) {
    throw new Error('Method [buildDelegates] not implemented!')
  }

  /**
   * [buildWallets description]
   * @param  {[type]} height [description]
   * @return {[type]}        [description]
   */
  buildWallets (height) {
    throw new Error('Method [buildWallets] not implemented!')
  }

  /**
   * [saveWallets description]
   * @param  {[type]} force [description]
   * @return {[type]}       [description]
   */
  saveWallets (force) {
    throw new Error('Method [saveWallets] not implemented!')
  }

  /**
   * [saveBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  saveBlock (block) {
    throw new Error('Method [saveBlock] not implemented!')
  }

  //Batch saving blocks, those blocks are not committed to database until saveBlockCommit is called
  /**
   * [saveBlockAsync description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  async saveBlockAsync (block) {
    throw new Error('Method [saveBlockAsync] not implemented!')
  }

  // To be used in combination with saveBlockAsync
  /**
   * [saveBlockCommit description]
   * @return {[type]} [description]
   */
  async saveBlockCommit () {
    throw new Error('Method [saveBlockCommit] not implemented!')
  }

  /**
   * [deleteBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  deleteBlock (block) {
    throw new Error('Method [deleteBlock] not implemented!')
  }

  /**
   * [getBlock description]
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  getBlock (id) {
    throw new Error('Method [getBlock] not implemented!')
  }

  /**
   * [getLastBlock description]
   * @return {[type]} [description]
   */
  getLastBlock () {
    throw new Error('Method [getLastBlock] not implemented!')
  }

  /**
   * [getBlocks description]
   * @param  {[type]} offset [description]
   * @param  {[type]} limit  [description]
   * @return {[type]}        [description]
   */
  getBlocks (offset, limit) {
    throw new Error('Method [getBlocks] not implemented!')
  }

  /**
   * [saveRounds description]
   * @param  {[type]} activeDelegates [description]
   * @return {[type]}                 [description]
   */
  saveRounds (activeDelegates) {
    throw new Error('Method [saveRounds] not implemented!')
  }

  /**
   * [deleteRound description]
   * @param  {[type]} round [description]
   * @return {[type]}       [description]
   */
  deleteRound (round) {
    throw new Error('Method [deleteRound] not implemented!')
  }

  /**
   * [updateDelegateStats description]
   * @param  {[type]} delegates [description]
   * @return {[type]}           [description]
   */
  updateDelegateStats (delegates) {
    throw new Error('Method [updateDelegateStats] not implemented!')
  }

  /**
   * [applyRound description]
   * @param  {[type]} height [description]
   * @return {[type]}        [description]
   */
  async applyRound (height) {
    const nextHeight = height === 1 ? 1 : height + 1
    const maxDelegates = config.getConstants(nextHeight).activeDelegates
    if (nextHeight % maxDelegates === 1) {
      const round = Math.floor((nextHeight - 1) / maxDelegates) + 1
      if (!this.activedelegates || this.activedelegates.length === 0 || (this.activedelegates.length && this.activedelegates[0].round !== round)) {
        logger.info(`New round ${round}`)
        await this.updateDelegateStats(await this.getLastBlock(), this.activedelegates)
        await this.saveWallets(false) // save only modified wallets during the last round
        const delegates = await this.buildDelegates(maxDelegates, nextHeight) // active build delegate list from database state
        await this.saveRounds(delegates) // save next round delegate list
        await this.getActiveDelegates(nextHeight) // generate the new active delegates list
      } else {
        logger.info(`New round ${round} already applied. This should happen only if you are a forger`)
      }
    }
  }

  /**
   * [undoRound description]
   * @param  {[type]} height [description]
   * @return {[type]}        [description]
   */
  async undoRound (height) {
    const maxDelegates = config.getConstants(height).activeDelegates
    const nextHeight = height + 1

    const round = Math.floor((height - 1) / maxDelegates) + 1
    const nextRound = Math.floor((nextHeight - 1) / config.getConstants(nextHeight).activeDelegates) + 1

    if (nextRound === round + 1 && height > maxDelegates) {
      logger.info(`Back to previous round: ${round}`)

      this.activedelegates = await this.getActiveDelegates(height) // active delegate list from database round
      await this.deleteRound(nextRound) // remove round delegate list
    }
  }

  /**
   * [validateDelegate description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  async validateDelegate (block) {
    const delegates = await this.getActiveDelegates(block.data.height)
    const slot = slots.getSlotNumber(block.data.timestamp)
    const forgingDelegate = delegates[slot % delegates.length]

    if (!forgingDelegate) {
      logger.debug('Could not decide yet if delegate ' + block.data.generatorPublicKey + ' is allowed to forge block ' + block.data.height)
    } else if (forgingDelegate.publicKey !== block.data.generatorPublicKey) {
      throw new Error(`Delegate ${block.data.generatorPublicKey} not allowed to forge, should be ${forgingDelegate.publicKey}`)
    } else {
      logger.debug('Delegate ' + block.data.generatorPublicKey + ' allowed to forge block ' + block.data.height)
    }
  }

  /**
   * [validateForkedBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  async validateForkedBlock (block) {
    await this.validateDelegate(block)
  }

  /**
   * [applyBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  async applyBlock (block) {
    await this.validateDelegate(block)
    await this.walletManager.applyBlock(block)
    await this.applyRound(block.data.height)
  }

  /**
   * [undoBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  async undoBlock (block) {
    await this.undoRound(block.data.height)
    await this.walletManager.undoBlock(block)
    // webhookManager.emit('block.removed', block)
  }

  /**
   * [verifyTransaction description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  verifyTransaction (transaction) {
    const senderId = crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)
    let sender = this.walletManager.getWalletByAddress[senderId] // should exist
    if (!sender.publicKey) {
      sender.publicKey = transaction.data.senderPublicKey
      this.walletManager.reindex(sender)
    }
    return sender.canApply(transaction.data) && !this.getTransaction(transaction.data.id)
  }

  /**
   * [applyTransaction description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  applyTransaction (transaction) {
    return this.walletManager.applyTransaction(transaction)
  }

  /**
   * [undoTransaction description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  undoTransaction (transaction) {
    return this.walletManager.undoTransaction(transaction)
  }

  /**
   * [snapshot description]
   * @param  {[type]} path [description]
   * @return {[type]}      [description]
   */
  async snapshot (path) {
    const fs = require('fs')
    const wstream = fs.createWriteStream(`${path}/blocks.dat`)
    let max = 100000 // eslint-disable-line no-unused-vars
    let offset = 0
    const writeQueue = async.queue((block, qcallback) => {
      wstream.write(block)
      qcallback()
    }, 1)

    let blocks = await this.getBlockHeaders(offset, offset + 100000)
    writeQueue.push(blocks)
    max = blocks.length
    offset += 100000
    console.log(offset)

    writeQueue.drain = async () => {
      console.log('drain')
      blocks = await this.getBlockHeaders(offset, offset + 100000)
      writeQueue.push(blocks)
      max = blocks.length
      offset += 100000
      console.log(offset)
    }
  }

  /**
   * [__registerWalletManager description]
   * @return {[type]} [description]
   */
  async __registerWalletManager () {
    this.walletManager = new WalletManager()
  }

  /**
   * [__registerRepositories description]
   * @return {[type]} [description]
   */
  async __registerRepositories () {
    this['wallets'] = new (require('./repositories/wallets'))(this)
    this['delegates'] = new (require('./repositories/delegates'))(this)
  }
}
