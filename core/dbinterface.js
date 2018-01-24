const arkjs = require('arkjs')
const Account = requireFrom('model/account')
const AccountManager = require('./accountManager')
const config = require('./config')
const logger = require('./logger')
const Promise = require('bluebird')
const async = require('async')
const fs = require('fs')
const path = require('path')
const human = require('interval-to-human')

let synctracker
let instance

const tickSyncTracker = (block, rebuild, fastRebuild) => {
  if (rebuild) { // basically don't make useless database interaction like saving account state
    if (!synctracker) {
      synctracker = {
        starttimestamp: block.data.timestamp,
        startdate: new Date().getTime()
      }
    }
    const remainingtime = (arkjs.slots.getTime() - block.data.timestamp) * (block.data.timestamp - synctracker.starttimestamp) / (new Date().getTime() - synctracker.startdate)
    const title = fastRebuild ? 'Fast Synchronisation' : 'Full Synchronisation'
    logger.printTracker(title, block.data.timestamp, arkjs.slots.getTime(), human(remainingtime), 3)
  }
}

class DBInterface {
  static getInstance () {
    return instance
  }

  static create (config) {
    const db = new (require(path.resolve(config.driver)))()
    db.accountManager = new AccountManager()

    return db
      .init(config)
      .then(() => (instance = db))
      .then(() => this.registerRepositories(config.driver))
  }

  static registerRepositories (driver) {
    let directory = path.resolve(driver, 'repositories')

    fs.readdirSync(directory).forEach(file => {
      if (file.indexOf('.js') !== -1) {
        instance[file.slice(0, -3)] = new (require(directory + '/' + file))(instance)
      }
    })

    // this is a special case repository and will be forced to be read from memory...
    instance['accounts'] = new (requireFrom('database/repositories/accounts'))(instance)

    return Promise.resolve(instance)
  }

  // getActiveDelegates (height) {
  // }

  // buildDelegates (block) {
  // }

  // buildAccounts () {
  // }

  // saveAccounts (force) {
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

  applyRound (block, syncing, fastSync) {
    tickSyncTracker(block, syncing, fastSync)
    if ((!fastSync && block.data.height % config.getConstants(block.data.height).activeDelegates === 0) || block.data.height === 1) {
      if (syncing) { // basically don't make useless database interaction like saving account state
        return this.buildDelegates(block)
          .then(() => this.rounds.bulkCreate(this.activedelegates))
          .then(() => block)
      } else {
        logger.info('New round', block.data.height / config.getConstants(block.data.height).activeDelegates)
        return this
          .saveAccounts(true) // save only modified accounts during the last round
          .then(() => this.buildDelegates(block)) // active build delegate list from database state
          .then(() => this.rounds.bulkCreate(this.activedelegates)) // save next round delegate list
          .then(() => block)
      }
    } else {
      return Promise.resolve(block)
    }
  }

  undoRound (block) {
    const previousHeight = block.data.height - 1
    const round = ~~(block.data.height / config.getConstants(block.data.height).activeDelegates)
    const previousRound = ~~(previousHeight / config.getConstants(previousHeight).activeDelegates)
    if (previousRound + 1 === round && block.data.height > 51) {
      logger.info('Back to previous round', previousRound)
      return this.getActiveDelegates(previousHeight) // active delegate list from database round
        .then(() => this.deleteRound(round)) // remove round delegate list
        .then(() => block)
    } else {
      return Promise.resolve(block)
    }
  }

  applyBlock (block, rebuild, fastRebuild) {
    return this.accountManager
      .applyBlock(block)
      .then(() => this.applyRound(block, rebuild, fastRebuild))
  }

  undoBlock (block) {
    return this.accountManager
      .undoBlock(block)
      .then(() => this.undoRound(block))
  }

  verifyTransaction (transaction) {
    const senderId = arkjs.crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)
    let sender = this.accountManager.getAccountByAddress[senderId] // should exist
    if (!sender.publicKey) {
      sender.publicKey = transaction.data.senderPublicKey
      this.accountManager.updateAccount(sender)
    }
    return sender.canApply(transaction.data)
  }

  applyTransaction (transaction) {
    return this.accountManager.applyTransaction(transaction)
  }

  undoTransaction (transaction) {
    return this.accountManager.undoTransaction(transaction)
  }

  snapshot (path) {
    const fs = require('fs')
    const wstream = fs.createWriteStream(`${path}/blocks.dat`)
    let max = 100000 // eslint-disable-line no-unused-vars
    let offset = 0
    const writeQueue = async.queue((block, qcallback) => {
      wstream.write(block)
      qcallback()
    }, 1)
    this.getBlockHeaders(offset, offset + 100000).then(blocks => {
      writeQueue.push(blocks)
      max = blocks.length
      offset += 100000
      console.log(offset)
    })
    writeQueue.drain = () => {
      console.log('drain')
      this.getBlockHeaders(offset, offset + 100000).then(blocks => {
        writeQueue.push(blocks)
        max = blocks.length
        offset += 100000
        console.log(offset)
      })
    }
  }
}

module.exports = DBInterface
