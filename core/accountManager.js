const Account = requireFrom('model/account')
const config = requireFrom('core/config')
const logger = requireFrom('core/logger')
const arkjs = require('arkjs')
const Promise = require('bluebird')

class AccountManager {
  constructor () {
    this.reset()
  }

  reset () {
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
    let delegate = this.accountsByPublicKey[block.data.generatorPublicKey]
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
      const datatx = transaction.data
      let sender = this.accountsByPublicKey[datatx.senderPublicKey]
      if (!sender) {
        const senderId = arkjs.crypto.getAddress(datatx.senderPublicKey, config.network.pubKeyHash)
        sender = this.accountsByAddress[senderId] // should exist
        if (!sender.publicKey) sender.publicKey = datatx.senderPublicKey
        this.accountsByPublicKey[datatx.senderPublicKey] = sender
      }
      const recipientId = datatx.recipientId // may not exist
      let recipient = this.accountsByAddress[recipientId]
      if (!recipient && recipientId) { // cold wallet
        recipient = new Account(recipientId)
        this.accountsByAddress[recipientId] = recipient
      }
      if (datatx.type === 2 && this.delegatesByUsername[datatx.asset.delegate.username.toLowerCase()]) {
        logger.error(sender)
        logger.error(JSON.stringify(datatx))
        return reject(new Error(`Can't apply transaction ${datatx.id}: delegate name already taken`))
      } else if (datatx.type === 3 && !this.accountsByPublicKey[datatx.asset.votes[0].slice(1)].username) {
        logger.error(sender)
        logger.error(JSON.stringify(datatx))
        return reject(new Error(`Can't apply transaction ${datatx.id}: voted delegate does not exist`))
      }
      if (config.network.exceptions[datatx.id]) {
        logger.warn('Transaction is forced to be applied because it has been added as an exception:')
        logger.warn(JSON.stringify(datatx))
      } else if (!sender.canApply(datatx)) {
        logger.error(sender)
        logger.error(JSON.stringify(datatx))
        return reject(new Error(`Can't apply transaction ${datatx.id}`))
      }
      sender.applyTransactionToSender(datatx)
      if (datatx.type === 0) recipient.applyTransactionToRecipient(datatx)
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
