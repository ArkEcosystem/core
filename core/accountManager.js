const Account = requireFrom('model/account')
const config = requireFrom('core/config')
const logger = requireFrom('core/logger')
const arkjs = require('arkjs')
const Promise = require('bluebird')

class AccountManager {
  constructor () {
    this.accountsByAddress = {}
    this.accountsByPublicKey = {}
    this.delegatesByUsername = {}
  }

  updateAccount (account) {
    if (account.address) this.accountsByAddress[account.address] = account
    if (account.publicKey) this.accountsByPublicKey[account.publicKey] = account
    if (account.username) this.delegatesByUsername[account.username] = account
  }

  applyBlock (block) {
    let delegate = this.accountsByPublicKey[block.data.generatorPublicKey]
    if (!delegate && block.data.height === 1) {
      const generator = arkjs.crypto.getAddress(block.data.generatorPublicKey, config.network.pubKeyHash)
      delegate = new Account(generator)
      delegate.publicKey = block.data.generatorPublicKey
      this.accountsByAddress[generator] = delegate
      this.accountsByPublicKey[block.generatorPublicKey] = delegate
    }
    const appliedTransactions = []
    return Promise
      .each(block.transactions, tx => this.applyTransaction(tx).then(() => appliedTransactions.push(tx)))
      .catch(error => Promise
        .each(appliedTransactions, tx => this.undoTransaction(tx))
        .then(() => Promise.reject(error))
      )
      .then(() => delegate.applyBlock(block.data))
  }

  undoBlock (block) {
    let delegate = this.accountsByAddress[block.data.generatorPublicKey]
    const undoedTransactions = []
    const that = this
    return Promise
      .each(block.transactions, tx =>
        that.undoTransaction(tx)
        .then(() => undoedTransactions.push(tx))
      )
      .then(() => delegate.undoBlock(block.data))
      .catch(error => Promise
        .each(undoedTransactions, tx =>
          that.applyTransaction(tx))
         .then(() => Promise.reject(error)
        )
      )
  }

  applyTransaction (transaction) {
    return new Promise((resolve, reject) => {
      let sender = this.accountsByPublicKey[transaction.senderPublicKey]
      if (!sender) {
        const senderId = arkjs.crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)
        sender = this.accountsByAddress[senderId] // should exist
        if (!sender.publicKey) sender.publicKey = transaction.data.senderPublicKey
        this.accountsByPublicKey[transaction.senderPublicKey] = sender
      }
      const recipientId = transaction.data.recipientId // may not exist
      let recipient = this.accountsByAddress[recipientId]
      if (!recipient && recipientId) { // cold wallet
        recipient = new Account(recipientId)
        this.accountsByAddress[recipientId] = recipient
      }
      if (transaction.type === 2 && this.delegatesByUsername[transaction.asset.delegate.username.toLowerCase()]) {
        logger.error(sender)
        logger.error(JSON.stringify(transaction.data))
        return reject(new Error(`Can't apply transaction ${transaction.data.id}: delegate name already taken`))
      } else if (transaction.type === 3 && !this.accountsByPublicKey[transaction.asset.votes[0].slice(1)].username) {
        logger.error(sender)
        logger.error(JSON.stringify(transaction.data))
        return reject(new Error(`Can't apply transaction ${transaction.data.id}: voted delegate does not exist`))
      }
      if (config.network.exceptions[transaction.data.id]) {
        logger.warn('Transaction is forced to be applied because it has been added as an exception:')
        logger.warn(JSON.stringify(transaction.data))
      } else if (!sender.canApply(transaction.data)) {
        logger.error(sender)
        logger.error(JSON.stringify(transaction.data))
        return reject(new Error(`Can't apply transaction ${transaction.data.id}`))
      }
      sender.applyTransactionToSender(transaction.data)
      if (transaction.type === 0) recipient.applyTransactionToRecipient(transaction.data)
      // TODO: faster way to maintain active delegate list (ie instead of db queries)
      // if (sender.vote) {
      //   const delegateAdress = arkjs.crypto.getAddress(transaction.data.asset.votes[0].slice(1), config.network.pubKeyHash)
      //   const delegate = this.localaccounts[delegateAdress]
      //   delegate.applyVote(sender, transaction.data.asset.votes[0])
      // }
      return resolve(transaction)
    })
  }

  undoTransaction (transaction) {
    let sender = this.accountsByPublicKey[transaction.data.senderPublicKey] // should exist
    let recipient = this.accountsByAddress[transaction.data.recipientId]
    sender.undoTransactionToSender(transaction.data)
    if (recipient && transaction.type === 0) recipient.undoTransactionToRecipient(transaction.data)
    return Promise.resolve(transaction.data)
  }

  getAccountByAddress (address) {
    let account = this.accountsByAddress[address]
    if (account) return account
    else {
      account = new Account(address)
      this.accountsByAddress[address] = account
      return account
    }
  }

  getAccountByPublicKey (publicKey) {
    let account = this.accountsByPublicKey[publicKey]
    if (account) return account
    else {
      const address = arkjs.crypto.getAddress(publicKey, config.network.pubKeyHash)
      account = this.getAccountByAddress(address)
      account.publicKey = publicKey
      this.accountsByPublicKey[publicKey] = account
      return account
    }
  }

  getDelegate (username) {
    return this.delegatesByUsername[username]
  }

  getLocalAccounts () { // for compatibility with API
    return Object.values(this.accountsByAddress)
  }
}

module.exports = AccountManager
