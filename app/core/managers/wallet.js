const Wallet = require('app/models/wallet')
const config = require('app/core/config')
const logger = require('app/core/logger')
const arkjs = require('arkjs')
const Promise = require('bluebird')

module.exports = class WalletManager {
  constructor () {
    this.reset()
  }

  reset () {
    this.walletsByAddress = {}
    this.walletsByPublicKey = {}
    this.delegatesByUsername = {}
  }

  reindex (wallet) {
    if (wallet.address) this.walletsByAddress[wallet.address] = wallet
    if (wallet.publicKey) this.walletsByPublicKey[wallet.publicKey] = wallet
    if (wallet.username) this.delegatesByUsername[wallet.username] = wallet
  }

  async applyBlock (block) {
    let delegate = this.walletsByPublicKey[block.data.generatorPublicKey]
    if (!delegate && block.data.height === 1) {
      const generator = arkjs.crypto.getAddress(block.data.generatorPublicKey, config.network.pubKeyHash)
      delegate = new Wallet(generator)
      delegate.publicKey = block.data.generatorPublicKey
      this.walletsByAddress[generator] = delegate
      this.walletsByPublicKey[block.generatorPublicKey] = delegate
    }
    const appliedTransactions = []

    try {
      await Promise.each(block.transactions, async (tx) => {
        await this.applyTransaction(tx)

        appliedTransactions.push(tx)
      })

      return delegate.applyBlock(block.data)
    } catch (error) {
      logger.error(error.stack)
      await Promise.each(appliedTransactions, tx => this.undoTransaction(tx))
      throw error
    }
  }

  async undoBlock (block) {
    let delegate = this.walletsByPublicKey[block.data.generatorPublicKey]

    const undoedTransactions = []
    const that = this

    try {
      await Promise.each(block.transactions, async (tx) => {
        await that.undoTransaction(tx)

        undoedTransactions.push(tx)
      })

      return delegate.undoBlock(block.data)
    } catch (error) {
      logger.error(error.stack)
      await Promise.each(undoedTransactions, async (tx) => that.applyTransaction(tx))
      throw error
    }
  }

  async applyTransaction (transaction) {
    const datatx = transaction.data
    let sender = this.walletsByPublicKey[datatx.senderPublicKey]
    if (!sender) {
      const senderId = arkjs.crypto.getAddress(datatx.senderPublicKey, config.network.pubKeyHash)
      sender = this.walletsByAddress[senderId] // should exist
      if (!sender.publicKey) sender.publicKey = datatx.senderPublicKey
      this.walletsByPublicKey[datatx.senderPublicKey] = sender
    }

    const recipientId = datatx.recipientId // may not exist
    let recipient = this.walletsByAddress[recipientId]
    if (!recipient && recipientId) { // cold wallet
      recipient = new Wallet(recipientId)
      this.walletsByAddress[recipientId] = recipient
    }

    if (datatx.type === 2 && this.delegatesByUsername[datatx.asset.delegate.username.toLowerCase()]) {
      logger.error(`[TX2] Send by ${sender.address}`, JSON.stringify(datatx))
      throw new Error(`Can't apply transaction ${datatx.id}: delegate name already taken`)
    } else if (datatx.type === 3 && !this.walletsByPublicKey[datatx.asset.votes[0].slice(1)].username) {
      logger.error(`[TX3] Send by ${sender.address}`, JSON.stringify(datatx))
      throw new Error(`Can't apply transaction ${datatx.id}: voted delegate does not exist`)
    }

    if (config.network.exceptions[datatx.id]) {
      logger.warn('Transaction is forced to be applied because it has been added as an exception:')
      logger.warn(datatx)
    } else if (!sender.canApply(datatx)) {
      logger.info(JSON.stringify(sender))
      logger.error(`[sender.canApply] Send by ${sender.address}`, JSON.stringify(datatx))
      throw new Error(`Can't apply transaction ${datatx.id}`)
    }

    sender.applyTransactionToSender(datatx)

    if (datatx.type === 0) recipient.applyTransactionToRecipient(datatx)
    // TODO: faster way to maintain active delegate list (ie instead of db queries)
    // if (sender.vote) {
    //   const delegateAdress = arkjs.crypto.getAddress(transaction.data.asset.votes[0].slice(1), config.network.pubKeyHash)
    //   const delegate = this.localwallets[delegateAdress]
    //   delegate.applyVote(sender, transaction.data.asset.votes[0])
    // }
    return transaction
  }

  async undoTransaction (transaction) {
    let sender = this.walletsByPublicKey[transaction.data.senderPublicKey] // should exist
    let recipient = this.walletsByAddress[transaction.data.recipientId]
    sender.undoTransactionToSender(transaction.data)

    if (recipient && transaction.type === 0) {
      recipient.undoTransactionToRecipient(transaction.data)
    }

    return transaction.data
  }

  getWalletByAddress (address) {
    let wallet = this.walletsByAddress[address]
    if (wallet) return wallet
    else {
      if (!arkjs.crypto.validateAddress(address, config.network.pubKeyHash)) {
        return null
      }
      wallet = new Wallet(address)
      this.walletsByAddress[address] = wallet
      return wallet
    }
  }

  getWalletByPublicKey (publicKey) {
    let wallet = this.walletsByPublicKey[publicKey]
    if (wallet) return wallet
    else {
      const address = arkjs.crypto.getAddress(publicKey, config.network.pubKeyHash)
      wallet = this.getWalletByAddress(address)
      wallet.publicKey = publicKey
      this.walletsByPublicKey[publicKey] = wallet
      return wallet
    }
  }

  getDelegate (username) {
    return this.delegatesByUsername[username]
  }

  getLocalWallets () { // for compatibility with API
    return Object.values(this.walletsByAddress)
  }
}
