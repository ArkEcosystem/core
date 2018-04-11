const arkjs = require('arkjs')
const WalletManager = require('./managers/wallet')
const config = require('./config')
const logger = require('./logger')
const async = require('async')
const fs = require('fs')
const path = require('path')

let instance

class DBInterface {
  static getInstance () {
    return instance
  }

  static async create (config) {
    const db = new (require(path.resolve(config.driver)))()
    db.walletManager = new WalletManager()

    await db.init(config)
    instance = db
    this.registerRepositories(config.driver)

    return instance
  }

  static registerRepositories (driver) {
    let directory = path.resolve(driver, 'repositories')

    fs.readdirSync(directory).forEach(file => {
      if (file.indexOf('.js') !== -1) {
        instance[file.slice(0, -3)] = new (require(directory + '/' + file))(instance)
      }
    })

    // this is a special case repository and will be forced to be read from memory...
    instance['wallets'] = new (require('../database/repositories/wallets'))(instance)
  }

  getActiveDelegates (height) {
    throw new Error('Method [getActiveDelegates] not implemented!')
  }

  buildDelegates (maxDelegates, height) {
    throw new Error('Method [buildDelegates] not implemented!')
  }

  buildWallets (height) {
    throw new Error('Method [buildWallets] not implemented!')
  }

  saveWallets (force) {
    throw new Error('Method [saveWallets] not implemented!')
  }

  saveBlock (block) {
    throw new Error('Method [saveBlock] not implemented!')
  }

  deleteBlock (block) {
    throw new Error('Method [deleteBlock] not implemented!')
  }

  getBlock (id) {
    throw new Error('Method [getBlock] not implemented!')
  }

  getLastBlock () {
    throw new Error('Method [getLastBlock] not implemented!')
  }

  getBlocks (offset, limit) {
    throw new Error('Method [getBlocks] not implemented!')
  }

  saveRounds (activeDelegates) {
    throw new Error('Method [saveRounds] not implemented!')
  }

  deleteRound (round) {
    throw new Error('Method [deleteRound] not implemented!')
  }

  updateDelegateStats (delegates) {
    throw new Error('Method [updateDelegateStats] not implemented!')
  }

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

  async validateDelegate (block) {
    const delegates = await this.getActiveDelegates(block.data.height)
    const slot = arkjs.slots.getSlotNumber(block.data.timestamp)
    const forgingDelegate = delegates[slot % delegates.length]

    if (!forgingDelegate) {
      logger.debug('Could not decide yet if delegate ' + block.data.generatorPublicKey + ' is allowed to forge block ' + block.data.height)
    } else if (forgingDelegate.publicKey !== block.data.generatorPublicKey) {
      throw new Error(`Delegate ${block.data.generatorPublicKey} not allowed to forge, should be ${forgingDelegate.publicKey}`)
    } else {
      logger.debug('Delegate ' + block.data.generatorPublicKey + ' allowed to forge block ' + block.data.height)
    }
  }

  async validateForkedBlock (block) {
    await this.validateDelegate(block)
  }

  async applyBlock (block) {
    await this.validateDelegate(block)
    await this.walletManager.applyBlock(block)
    await this.applyRound(block.data.height)
  }

  async undoBlock (block) {
    await this.undoRound(block.data.height)
    await this.walletManager.undoBlock(block)
    // webhookManager.getInstance().emit('block.removed', block)
  }

  verifyTransaction (transaction) {
    const senderId = arkjs.crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)
    let sender = this.walletManager.getWalletByAddress[senderId] // should exist
    if (!sender.publicKey) {
      sender.publicKey = transaction.data.senderPublicKey
      this.walletManager.reindex(sender)
    }
    return sender.canApply(transaction.data) && !this.getTransaction(transaction.data.id)
  }

  applyTransaction (transaction) {
    return this.walletManager.applyTransaction(transaction)
  }

  undoTransaction (transaction) {
    return this.walletManager.undoTransaction(transaction)
  }

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
}

module.exports = DBInterface
