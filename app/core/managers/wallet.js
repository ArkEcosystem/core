const Wallet = require('../../models/wallet')
const config = require('../config')
const logger = require('../logger')
const arkjs = require('arkjs')
const Promise = require('bluebird')
const { TRANSACTION_TYPES } = require('../constants')

module.exports = class WalletManager {
  constructor () {
    this.reset()
  }

  reset () {
    // TODO replace with Map: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
    // TODO use a closure / advanced properties to avoid exposing the properties (and force devs to use get methods)
    this.walletsByAddress = {}
    this.walletsByPublicKey = {}
    // TODO why not walletsByUsername ?
    this.delegatesByUsername = {}
  }

  /*
   * @param {Wallet}
   */
  reindex (wallet) {
    if (wallet.address) this.walletsByAddress[wallet.address] = wallet
    if (wallet.publicKey) this.walletsByPublicKey[wallet.publicKey] = wallet
    if (wallet.username) this.delegatesByUsername[wallet.username] = wallet
  }

  /*
   * @param {Block}
   */
  async applyBlock (block) {
    const generatorPublicKey = block.data.generatorPublicKey

    // TODO refactor
    let delegate = this.walletsByPublicKey[generatorPublicKey]
    if (!delegate) {
      const generator = arkjs.crypto.getAddress(generatorPublicKey, config.network.pubKeyHash)
      if (block.data.height === 1) {
        delegate = new Wallet(generator)
        delegate.publicKey = generatorPublicKey
        this.walletsByAddress[generator] = delegate
        // FIXME?
        // this.walletsByPublicKey[block.generatorPublicKey] = delegate
        this.walletsByPublicKey[generatorPublicKey] = delegate
      } else {
        logger.debug('delegate by address', this.walletsByAddress[generator])
        if (this.walletsByAddress[generator]) {
          logger.info('Oops ! this look like a bug, please report 🐛')
        }
        throw new Error(`Could not find delegate with publicKey ${generatorPublicKey}`)
      }
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

  /*
   * @param {Block}
   */
  async undoBlock (block) {
    const delegate = this.walletsByPublicKey[block.data.generatorPublicKey]

    const undoedTransactions = []
    try {
      await Promise.each(block.transactions, async (tx) => {
        await this.undoTransaction(tx)
        undoedTransactions.push(tx)
      })

      return delegate.undoBlock(block.data)
    } catch (error) {
      logger.error(error.stack)
      await Promise.each(undoedTransactions, async (tx) => this.applyTransaction(tx))
      throw error
    }
  }

  /*
   * @param {Transaction}
   */
  async applyTransaction (transaction) {
    const txData = transaction.data

    const sender = this.getWalletByPublicKey(txData.senderPublicKey) // Should exist
    const recipient = this.getWalletByAddress(txData.recipientId) // May not exist yet

    // FIXME why here is important lower case and not in other places?
    if (txData.type === TRANSACTION_TYPES.DELEGATE && this.delegatesByUsername[txData.asset.delegate.username.toLowerCase()]) {
      logger.error(`[TX2] Send by ${sender.address}`, JSON.stringify(txData))
      throw new Error(`Can't apply transaction ${txData.id}: delegate name already taken`)
    } else if (txData.type === TRANSACTION_TYPES.VOTE && !this.walletsByPublicKey[txData.asset.votes[0].slice(1)].username) {
      logger.error(`[TX3] Send by ${sender.address}`, JSON.stringify(txData))
      throw new Error(`Can't apply transaction ${txData.id}: voted delegate does not exist`)
    }

    if (config.network.exceptions[txData.id]) {
      logger.warning('Transaction is forced to be applied because it has been added as an exception:')
      logger.warning(txData)
    } else if (!sender.canApply(txData)) {
      logger.info(JSON.stringify(sender))
      logger.error(`[sender.canApply] Send by ${sender.address}`, JSON.stringify(txData))
      throw new Error(`Can't apply transaction ${txData.id}`)
    }

    sender.applyTransactionToSender(txData)
    if (txData.type === TRANSACTION_TYPES.TRANSFER) {
      recipient.applyTransactionToRecipient(txData)
    }

    // TODO: faster way to maintain active delegate list (ie instead of db queries)
    // if (sender.vote) {
    //   const delegateAdress = arkjs.crypto.getAddress(transaction.data.asset.votes[0].slice(1), config.network.pubKeyHash)
    //   const delegate = this.localwallets[delegateAdress]
    //   delegate.applyVote(sender, transaction.data.asset.votes[0])
    // }
    return transaction
  }

  /*
   * @param {Transaction}
   */
  async undoTransaction ({ type, data }) {
    const sender = this.walletsByPublicKey[data.senderPublicKey] // Should exist
    const recipient = this.walletsByAddress[data.recipientId]

    sender.undoTransactionToSender(data)

    if (recipient && type === TRANSACTION_TYPES.TRANSFER) {
      recipient.undoTransactionToRecipient(data)
    }

    return data
  }

  getWalletByAddress (address) {
    if (!this.walletsByAddress[address]) {
      if (!arkjs.crypto.validateAddress(address, config.network.pubKeyHash)) {
        // TODO throw an Error instead?
        return null
      }
      this.walletsByAddress[address] = new Wallet(address)
    }

    return this.walletsByAddress[address]
  }

  getWalletByPublicKey (publicKey) {
    if (!this.walletsByPublicKey[publicKey]) {
      const address = arkjs.crypto.getAddress(publicKey, config.network.pubKeyHash)
      this.walletsByPublicKey[publicKey] = this.getWalletByAddress(address)
      this.walletsByPublicKey[publicKey].publicKey = publicKey
    }

    return this.walletsByPublicKey[publicKey]
  }

  getDelegate (username) {
    return this.delegatesByUsername[username]
  }

  getLocalWallets () { // for compatibility with API
    return Object.values(this.walletsByAddress)
  }
}
