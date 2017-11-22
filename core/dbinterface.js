const arkjs = require('arkjs')
const Account = require('../model/account')
const config = require('./config')
const logger = require('./logger')

let instance

class DB {

  static getInstance () {
    return instance
  }

  static create (params) {
    const InstanceDB = (require(`${__dirname}/../${params.class}`))
    const db = new InstanceDB()
    db.init(params)
    instance = db
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

  // getBlock (id) {
  // }

  // getLastBlock () {
  // }

  // getBlocks (offset, limit) {
  // }

  applyRound (block, fastRebuild) {
    if ((!fastRebuild && block.data.height % config.getConstants(block.data.height).activeDelegates === 0) || block.data.height === 1) {
      logger.info('New round', block.data.height / config.getConstants(block.data.height).activeDelegates)
      return this
        .saveAccounts()
        .then(() => this.buildDelegates(block))
        .then(() => this.rounds.bulkCreate(this.activedelegates))
        .then(() => block)
    } else return Promise.resolve(block)
  }

  applyBlock (block, fastRebuild) {
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
      .all(
        block.transactions.map(
          (tx) => this
            .applyTransaction(tx)
            .then(() => appliedTransactions.push(tx))
        )
      )
      .then(() => delegate.applyBlock(block.data))
      .then(() => this.applyRound(block, fastRebuild))
      .catch((error) => {
        return Promise
          .all(appliedTransactions.map((tx) => that.undoTransaction(tx)))
          .then(() => Promise.reject(error))
      })
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
}

module.exports = DB
