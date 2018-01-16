const arkjs = require('arkjs')
const Account = require('../model/account')
const config = require('./config')
const logger = require('./logger')
const Promise = require('bluebird')
const async = require('async')
const fs = require('fs')
const path = require('path')

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
    const progress = block.data.timestamp * 100 / arkjs.slots.getTime()
    const title = fastRebuild ? 'Fast Synchronisation' : 'Full Synchronisation'
    logger.printTracker(title, progress, (block.data.timestamp * 100 / arkjs.slots.getTime()).toFixed(3), remainingtime)
  }
}

class DBInterface {
  static getInstance () {
    return instance
  }

  static create (params) {
    const db = new (require(path.resolve(params.driver)))()

    return db
      .init(params)
      .then(() => (instance = db))
      .then(() => this.registerRepositories(params.driver))
  }

  static registerRepositories (driver) {
    let directory = path.resolve(driver, 'repositories')

    fs.readdirSync(directory).forEach(file => {
      if (file.indexOf('.js') !== -1) {
        instance[file.slice(0, -3)] = new (require(directory + '/' + file))(instance)
      }
    })

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
    const generator = arkjs.crypto.getAddress(block.data.generatorPublicKey, config.network.pubKeyHash)
    let delegate = this.localaccounts[generator]
    if (!delegate && block.data.height === 1) {
      delegate = new Account(generator)
      delegate.publicKey = block.data.generatorPublicKey
      this.localaccounts[generator] = delegate
    }
    const appliedTransactions = []
    const that = this
    return Promise
      .each(block.transactions, tx => this
        .applyTransaction(tx)
        .then(() => appliedTransactions.push(tx))
      )
      .then(() => delegate.applyBlock(block.data))
      .then(() => this.applyRound(block, rebuild, fastRebuild))
      .catch(error => Promise
        .each(appliedTransactions, tx => that.undoTransaction(tx))
        .then(() => Promise.reject(error))
      )
  }

  undoBlock (block) {
    const generator = arkjs.crypto.getAddress(block.data.generatorPublicKey, config.network.pubKeyHash)
    let delegate = this.localaccounts[generator]
    const undoedTransactions = []
    const that = this
    return Promise
      .each(block.transactions, tx =>
        that.undoTransaction(tx)
        .then(() => undoedTransactions.push(tx))
      )
      .then(() => delegate.undoBlock(block.data))
      .then(() => this.undoRound(block))
      .catch(error => Promise
        .each(undoedTransactions, tx =>
          that.applyTransaction(tx))
         .then(() => Promise.reject(error)
        )
      )
  }

  verifyTransaction (transaction) {
    const senderId = arkjs.crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)
    let sender = this.localaccounts[senderId] // should exist
    if (!sender.publicKey) sender.publicKey = transaction.data.senderPublicKey
    return sender.canApply(transaction.data)
  }

  applyTransaction (transaction) {
    const senderId = arkjs.crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)
    const recipientId = transaction.data.recipientId // may not exist
    let sender = this.localaccounts[senderId] // should exist
    if (!sender.publicKey) sender.publicKey = transaction.data.senderPublicKey
    let recipient = this.localaccounts[recipientId]
    if (!recipient && recipientId) { // cold wallet
      recipient = new Account(recipientId)
      this.localaccounts[recipientId] = recipient
    }
    if (!config.network.exceptions[transaction.data.id] && !sender.canApply(transaction.data)) {
      logger.error(sender)
      logger.error(JSON.stringify(transaction.data))
      return Promise.reject(new Error(`Can't apply transaction ${transaction.data.id}`))
    }
    sender.applyTransactionToSender(transaction.data)
    if (recipient) recipient.applyTransactionToRecipient(transaction.data)
    // TODO: faster way to maintain active delegate list (ie instead of db queries)
    // if (sender.vote) {
    //   const delegateAdress = arkjs.crypto.getAddress(transaction.data.asset.votes[0].slice(1), config.network.pubKeyHash)
    //   const delegate = this.localaccounts[delegateAdress]
    //   delegate.applyVote(sender, transaction.data.asset.votes[0])
    // }
    return Promise.resolve(transaction)
  }

  undoTransaction (transaction) {
    const senderId = arkjs.crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)
    const recipientId = transaction.data.recipientId // may not exist
    let sender = this.localaccounts[senderId] // should exist
    let recipient = this.localaccounts[recipientId]
    sender.undoTransactionToSender(transaction.data)
    if (recipient) recipient.undoTransactionToRecipient(transaction.data)
    return Promise.resolve(transaction.data)
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
