const arkjs = require('arkjs')
const WalletManager = require('app/core/managers/wallet')
const config = require('app/core/config')
const logger = require('app/core/logger')
const async = require('async')
const fs = require('fs')
const path = require('path')
const human = require('interval-to-human')

let synctracker
let instance

const tickSyncTracker = (block, rebuild, fastRebuild) => {
  if (rebuild) { // basically don't make useless database interaction like saving wallet state
    if (!synctracker) {
      synctracker = {
        starttimestamp: block.data.timestamp,
        startdate: new Date().getTime()
      }
    }
    const remainingtime = (arkjs.slots.getTime() - block.data.timestamp) * (block.data.timestamp - synctracker.starttimestamp) / (new Date().getTime() - synctracker.startdate)
    const title = fastRebuild ? 'Fast Synchronisation' : 'Full Synchronisation'
    if (block.data.timestamp - arkjs.slots.getTime() < 8) {
      logger.printTracker(title, block.data.timestamp, arkjs.slots.getTime(), human(remainingtime), 3)
    } else {
      logger.stopTracker(title, arkjs.slots.getTime(), arkjs.slots.getTime())
    }
  }
}

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
    instance['wallets'] = new (require('app/database/repositories/wallets'))(instance)
  }

  // getActiveDelegates (height) {
  // }

  // buildDelegates (block) {
  // }

  // buildWallets () {
  // }

  // saveWallets (force) {
  // }

  // saveBlock (block) {
  // }

  // deleteBlock (block) {
  // }

  // getBlock (id) {
  // }

  // getLastBlock () {
  // }

  // getBlocks (offset, limit) {
  // }

  // saveRounds (rounds) {
  // }

  // deleteRound (round) {
  // }

  async applyRound (block, rebuild, fastRebuild) {
    tickSyncTracker(block, rebuild, fastRebuild)
    if ((!fastRebuild && block.data.height % config.getConstants(block.data.height).activeDelegates === 0) || block.data.height === 1) {
      if (rebuild) { // basically don't make useless database interaction like saving wallet state
        await this.buildDelegates(block)
        await this.saveRounds(this.activedelegates)
      } else {
        logger.info('New round', block.data.height / config.getConstants(block.data.height).activeDelegates)

        await this.saveWallets(false) // save only modified wallets during the last round
        await this.buildDelegates(block) // active build delegate list from database state
        await this.saveRounds(this.activedelegates) // save next round delegate list
      }
    }

    return block
  }

  async undoRound (block) {
    const previousHeight = block.data.height - 1
    const round = ~~(block.data.height / config.getConstants(block.data.height).activeDelegates)
    const previousRound = ~~(previousHeight / config.getConstants(previousHeight).activeDelegates)

    if (previousRound + 1 === round && block.data.height > 51) {
      logger.info('Back to previous round', previousRound)

      await this.getActiveDelegates(previousHeight) // active delegate list from database round
      await this.deleteRound(round) // remove round delegate list
    }

    return block
  }

  async applyBlock (block, rebuild, fastRebuild) {
    await this.walletManager.applyBlock(block)

    return this.applyRound(block, rebuild, fastRebuild)
  }

  async undoBlock (block) {
    await this.walletManager.undoBlock(block)

    return this.undoRound(block)
  }

  verifyTransaction (transaction) {
    const senderId = arkjs.crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)
    let sender = this.walletManager.getWalletByAddress[senderId] // should exist
    if (!sender.publicKey) {
      sender.publicKey = transaction.data.senderPublicKey
      this.walletManager.updateWallet(sender)
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
