'use strict';

const async = require('async')
const { crypto, slots } = require('@arkecosystem/client')
const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const logger = pluginManager.get('logger')
const WalletManager = require('./wallet-manager')

module.exports = class ConnectionInterface {
  /**
   * [constructor description]
   * @param  {Object} config
   */
  constructor (config) {
    this.config = config
    this.connection = null
  }

  /**
   * [getConnection description]
   * @return {ConnectionInterface}
   */
  getConnection () {
    return this.connection
  }

  /**
   * [connect description]
   * @return {void}
   * @throws Error
   */
  async connect () {
    throw new Error('Method [connect] not implemented!')
  }

  /**
   * [disconnect description]
   * @return {void}
   * @throws Error
   */
  async disconnect () {
    throw new Error('Method [disconnect] not implemented!')
  }

  /**
   * [getActiveDelegates description]
   * @param  {Number} height
   * @return {void}
   * @throws Error
   */
  getActiveDelegates (height) {
    throw new Error('Method [getActiveDelegates] not implemented!')
  }

  /**
   * [buildDelegates description]
   * @param  {Number} maxDelegates
   * @param  {Number} height
   * @return {void}
   * @throws Error
   */
  buildDelegates (maxDelegates, height) {
    throw new Error('Method [buildDelegates] not implemented!')
  }

  /**
   * [buildWallets description]
   * @param  {Number} height
   * @return {void}
   * @throws Error
   */
  buildWallets (height) {
    throw new Error('Method [buildWallets] not implemented!')
  }

  /**
   * [saveWallets description]
   * @param  {Boolean} force
   * @return {void}
   * @throws Error
   */
  saveWallets (force) {
    throw new Error('Method [saveWallets] not implemented!')
  }

  /**
   * [saveBlock description]
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  saveBlock (block) {
    throw new Error('Method [saveBlock] not implemented!')
  }

  // Batch saving blocks, those blocks are not committed to database until saveBlockCommit is called
  /**
   * [saveBlockAsync description]
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  async saveBlockAsync (block) {
    throw new Error('Method [saveBlockAsync] not implemented!')
  }

  // To be used in combination with saveBlockAsync
  /**
   * [saveBlockCommit description]
   * @return {void}
   * @throws Error
   */
  async saveBlockCommit () {
    throw new Error('Method [saveBlockCommit] not implemented!')
  }

  /**
   * [deleteBlock description]
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  deleteBlock (block) {
    throw new Error('Method [deleteBlock] not implemented!')
  }

  /**
   * [getBlock description]
   * @param  {Block} id
   * @return {void}
   * @throws Error
   */
  getBlock (id) {
    throw new Error('Method [getBlock] not implemented!')
  }

  /**
   * [getLastBlock description]
   * @return {void}
   * @throws Error
   */
  getLastBlock () {
    throw new Error('Method [getLastBlock] not implemented!')
  }

  /**
   * [getBlocks description]
   * @param  {Number} offset
   * @param  {Number} limit
   * @return {void}
   * @throws Error
   */
  getBlocks (offset, limit) {
    throw new Error('Method [getBlocks] not implemented!')
  }

  /**
   * [saveRounds description]
   * @param  {Array} activeDelegates
   * @return {void}
   * @throws Error
   */
  saveRounds (activeDelegates) {
    throw new Error('Method [saveRounds] not implemented!')
  }

  /**
   * [deleteRound description]
   * @param  {Number} round
   * @return {void}
   * @throws Error
   */
  deleteRound (round) {
    throw new Error('Method [deleteRound] not implemented!')
  }

  /**
   * [updateDelegateStats description]
   * @param  {Array} delegates
   * @return {void}
   * @throws Error
   */
  updateDelegateStats (delegates) {
    throw new Error('Method [updateDelegateStats] not implemented!')
  }

  /**
   * [applyRound description]
   * @param  {Number} height
   * @return {void}
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
   * @param  {Number} height
   * @return {void}
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
   * @param  {Block} block
   * @return {void}
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
   * @param  {Block} block
   * @return {void}
   */
  async validateForkedBlock (block) {
    await this.validateDelegate(block)
  }

  /**
   * [applyBlock description]
   * @param  {Block} block
   * @return {void}
   */
  async applyBlock (block) {
    await this.validateDelegate(block)
    await this.walletManager.applyBlock(block)
    await this.applyRound(block.data.height)
  }

  /**
   * [undoBlock description]
   * @param  {Block} block
   * @return {void}
   */
  async undoBlock (block) {
    await this.undoRound(block.data.height)
    await this.walletManager.undoBlock(block)
    // webhookManager.emit('block.removed', block)
  }

  /**
   * [verifyTransaction description]
   * @param  {Transaction} transaction
   * @return {Boolean}
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
   * @param  {Transaction} transaction
   * @return {Transaction}
   */
  applyTransaction (transaction) {
    return this.walletManager.applyTransaction(transaction)
  }

  /**
   * [undoTransaction description]
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  undoTransaction (transaction) {
    return this.walletManager.undoTransaction(transaction)
  }

  /**
   * [snapshot description]
   * @return {void}
   */
  async snapshot () {
    const expandHomeDir = require('expand-home-dir')
    const path = expandHomeDir(pluginManager.config('databaseManager').snapshots)

    const fs = require('fs-extra')
    await fs.ensureFile(`${path}/blocks.dat`)

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
   * @return {void}
   */
  async __registerWalletManager () {
    this.walletManager = new WalletManager()
  }

  /**
   * [__registerRepositories description]
   * @return {void}
   */
  async __registerRepositories () {
    this['wallets'] = new (require('./repositories/wallets'))(this)
    this['delegates'] = new (require('./repositories/delegates'))(this)
  }
}
