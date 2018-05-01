'use strict'

const async = require('async')
const fs = require('fs')
const { crypto, slots } = require('@arkecosystem/client')
const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const logger = pluginManager.get('logger')
const emitter = pluginManager.get('event-emitter')
const blockchain = pluginManager.get('blockchain')
const WalletManager = require('./wallet-manager')

module.exports = class ConnectionInterface {
  /**
   * @constructor
   * @param {Object} config
   */
  constructor (config) {
    this.config = config
    this.connection = null

    this.__registerShutdownListener()
  }

  /**
   * Get the current connection.
   * @return {ConnectionInterface}
   */
  getConnection () {
    return this.connection
  }

  /**
   * Connect to a database.
   * @return {void}
   * @throws Error
   */
  async connect () {
    throw new Error('Method [connect] not implemented!')
  }

  /**
   * Disconnect from a database.
   * @return {void}
   * @throws Error
   */
  async disconnect () {
    throw new Error('Method [disconnect] not implemented!')
  }

  /**
   * Get the top 51 delegates.
   * @param  {Number} height
   * @return {void}
   * @throws Error
   */
  getActiveDelegates (height) {
    throw new Error('Method [getActiveDelegates] not implemented!')
  }

  /**
   * Load a list of delegates into memory.
   * @param  {Number} maxDelegates
   * @param  {Number} height
   * @return {void}
   * @throws Error
   */
  buildDelegates (maxDelegates, height) {
    throw new Error('Method [buildDelegates] not implemented!')
  }

  /**
   * Load a list of wallets into memory.
   * @param  {Number} height
   * @return {void}
   * @throws Error
   */
  buildWallets (height) {
    throw new Error('Method [buildWallets] not implemented!')
  }

  /**
   * Commit wallets from the memory.
   * @param  {Boolean} force
   * @return {void}
   * @throws Error
   */
  saveWallets (force) {
    throw new Error('Method [saveWallets] not implemented!')
  }

  /**
   * Commit the given block.
   * NOTE: to be used when node is in sync and committing newly received blocks
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  saveBlock (block) {
    throw new Error('Method [saveBlock] not implemented!')
  }

  /**
   * Commit the given block (async version).
   * NOTE: to use when rebuilding to decrease the number of database tx, and commit blocks (save only every 1000s for instance) using saveBlockCommit
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  async saveBlockAsync (block) {
    throw new Error('Method [saveBlockAsync] not implemented!')
  }

  /**
   * Commit the block database transaction.
   * NOTE: to be used in combination with saveBlockAsync
   * @return {void}
   * @throws Error
   */
  async saveBlockCommit () {
    throw new Error('Method [saveBlockCommit] not implemented!')
  }

  /**
   * Delete the given block.
   * @param  {Block} block
   * @return {void}
   * @throws Error
   */
  deleteBlock (block) {
    throw new Error('Method [deleteBlock] not implemented!')
  }

  /**
   * Get a block.
   * @param  {Block} id
   * @return {void}
   * @throws Error
   */
  getBlock (id) {
    throw new Error('Method [getBlock] not implemented!')
  }

  /**
   * Get last block.
   * @return {void}
   * @throws Error
   */
  getLastBlock () {
    throw new Error('Method [getLastBlock] not implemented!')
  }

  /**
   * Get blocks for the given offset and limit.
   * @param  {Number} offset
   * @param  {Number} limit
   * @return {void}
   * @throws Error
   */
  getBlocks (offset, limit) {
    throw new Error('Method [getBlocks] not implemented!')
  }

  /**
   * Store the given round.
   * @param  {Array} activeDelegates
   * @return {void}
   * @throws Error
   */
  saveRounds (activeDelegates) {
    throw new Error('Method [saveRounds] not implemented!')
  }

  /**
   * Delete the given round.
   * @param  {Number} round
   * @return {void}
   * @throws Error
   */
  deleteRound (round) {
    throw new Error('Method [deleteRound] not implemented!')
  }

  /**
   * Update delegate statistics in memory.
   * NOTE: must be called before saving new round of delegates
   * @param  {Array} delegates
   * @return {void}
   * @throws Error
   */
  updateDelegateStats (delegates) {
    throw new Error('Method [updateDelegateStats] not implemented!')
  }

  /**
   * Apply the round.
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
   * Remove the round.
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
   * Validate a delegate.
   * @param  {Block} block
   * @return {void}
   */
  async validateDelegate (block) {
    const delegates = await this.getActiveDelegates(block.data.height)
    const slot = slots.getSlotNumber(block.data.timestamp)
    const forgingDelegate = delegates[slot % delegates.length]

    if (!forgingDelegate) {
      logger.debug(`Could not decide if delegate ${block.data.generatorPublicKey} is allowed to forge block ${block.data.height}`)
    }

    if (forgingDelegate.publicKey !== block.data.generatorPublicKey) {
      throw new Error(`Delegate ${block.data.generatorPublicKey} not allowed to forge, should be ${forgingDelegate.publicKey}`)
    } else {
      logger.debug(`Delegate ${block.data.generatorPublicKey} allowed to forge block ${block.data.height}`)
    }

    return true
  }

  /**
   * Validate a forked block.
   * @param  {Block} block
   * @return {void}
   */
  async validateForkedBlock (block) {
    await this.validateDelegate(block)
  }

  /**
   * Apply the given block.
   * @param  {Block} block
   * @return {void}
   */
  async applyBlock (block) {
    await this.validateDelegate(block)
    await this.walletManager.applyBlock(block)
    await this.applyRound(block.data.height)
  }

  /**
   * Remove the given block.
   * @param  {Block} block
   * @return {void}
   */
  async undoBlock (block) {
    await this.undoRound(block.data.height)
    await this.walletManager.undoBlock(block)
    emitter.emit('block.removed', block)
  }

  /**
   * Verify a transaction.
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
   * Apply the given transaction.
   * @param  {Transaction} transaction
   * @return {Transaction}
   */
  applyTransaction (transaction) {
    return this.walletManager.applyTransaction(transaction)
  }

  /**
   * Remove the given transaction.
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  undoTransaction (transaction) {
    return this.walletManager.undoTransaction(transaction)
  }

  /**
   * Write blocks to file as a snapshot.
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
   * Register the wallet manager.
   * @return {void}
   */
  async _registerWalletManager () {
    this.walletManager = new WalletManager()
  }

  /**
   * Register the wallet and delegate repositories.
   * @return {void}
   */
  async _registerRepositories () {
    this['wallets'] = new (require('./repositories/wallets'))(this)
    this['delegates'] = new (require('./repositories/delegates'))(this)
  }

  /**
   * Handle any exit signals.
   * @return {void}
   */
  __registerShutdownListener () {
    const spvFile = `${process.env.ARK_PATH_DATA}/spv.json`

    const handleExit = async () => {
        await this.saveWallets(true)

        const lastBlock = blockchain.getState().lastBlock

        if (lastBlock) {
          await fs.writeFile(spvFile, JSON.stringify(lastBlock.data))
        }

        process.exit()
    }

    [
        `exit`, `uncaughtException`,
        `SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`
    ].forEach((eventType) => process.on(eventType, handleExit))
  }
}
