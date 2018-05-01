'use strict';

const Promise = require('bluebird')

const client = require('@arkecosystem/client')
const { crypto } = client
const { Wallet } = client.models
const { TRANSACTION_TYPES } = client.constants

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const logger = pluginManager.get('logger')
const emitter = pluginManager.get('event-emitter')

const map = require('lodash/map')
const genesisWallets = map(config.genesisBlock.transactions, 'senderId')

module.exports = class WalletManager {
  /**
   * Create a new wallet manager instance.
   * @constructor
   */
  constructor () {
    this.reset()
  }

  /**
   * Reset the wallets index.
   * @return {void}
   */
  reset () {
    this.walletsByAddress = {}
    this.walletsByPublicKey = {}
    this.delegatesByUsername = {}
  }

  /**
   * Reindex the given wallet.
   * @param  {Wallet} wallet
   * @return {void}
   */
  reindex (wallet) {
    if (wallet.address) {
      this.walletsByAddress[wallet.address] = wallet
    }

    if (wallet.publicKey) {
      this.walletsByPublicKey[wallet.publicKey] = wallet
    }

    if (wallet.username) {
      this.delegatesByUsername[wallet.username] = wallet
    }
  }

  canBePurged (wallet) {
    return wallet.balance === 0 && !wallet.secondPublicKey && !wallet.multisignature && !wallet.username
  }

  /**
   * Remove non-delegate wallets that have zero (0) balance from memory.
   * @return {void}
   */
  purgeEmptyNonDelegates () {
    Object.keys(this.walletsByAddress).forEach(address => {
      if (this.canBePurged(this.walletsByAddress[address])) {
        delete this.walletsByAddress[address]
      }
    })
    Object.keys(this.walletsByPublicKey).forEach(publicKey => {
      if (this.canBePurged(this.walletsByPublicKey[publicKey])) {
        delete this.walletsByPublicKey[publicKey]
      }
    })
  }

  /**
   * Apply the given block to a delegate.
   * @param  {Block} block
   * @return {void}
   */
  async applyBlock (block) {
    let delegate = this.walletsByPublicKey[block.data.generatorPublicKey]

    if (!delegate) {
      const generator = crypto.getAddress(block.data.generatorPublicKey, config.network.pubKeyHash)

      if (block.data.height === 1) {
        delegate = new Wallet(generator)
        delegate.publicKey = block.data.generatorPublicKey

        this.walletsByAddress[generator] = delegate
        this.walletsByPublicKey[block.generatorPublicKey] = delegate
      } else {
        logger.debug('Delegate by address', this.walletsByAddress[generator])

        if (this.walletsByAddress[generator]) {
          logger.info('This look like a bug, please report :bug:')
        }

        throw new Error('Could not find delegate with publicKey ' + block.data.generatorPublicKey)
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

  /**
   * Remove the given block from a delegate.
   * @param  {Block} block
   * @return {void}
   */
  async undoBlock (block) {
    let delegate = this.walletsByPublicKey[block.data.generatorPublicKey] // FIXME: this is empty during fork recovery

    // README: temporary (?) fix for the above issue that the delegate is empty on fork recovery
    if (!delegate) {
      const generator = crypto.getAddress(block.data.generatorPublicKey, config.network.pubKeyHash)

      delegate = new Wallet(generator)
      delegate.publicKey = block.data.generatorPublicKey
      this.walletsByAddress[generator] = delegate
      this.walletsByPublicKey[block.generatorPublicKey] = delegate
    }

    const undoneTransactions = []
    const that = this

    try {
      await Promise.each(block.transactions, async (tx) => {
        await that.undoTransaction(tx)

        undoneTransactions.push(tx)
      })

      return delegate.undoBlock(block.data)
    } catch (error) {
      logger.error(error.stack)

      await Promise.each(undoneTransactions, async (tx) => that.applyTransaction(tx))

      throw error
    }
  }

  /**
   * Apply the given transaction to a delegate.
   * @param  {Transaction} transaction
   * @return {Transaction}
   */
  async applyTransaction (transaction) {
    const datatx = transaction.data
    let sender = this.walletsByPublicKey[datatx.senderPublicKey]

    if (!sender) {
      const senderId = crypto.getAddress(datatx.senderPublicKey, config.network.pubKeyHash)
      sender = this.walletsByAddress[senderId] // should exist

      if (!sender.publicKey) {
        sender.publicKey = datatx.senderPublicKey
      }

      this.walletsByPublicKey[datatx.senderPublicKey] = sender
    }

    const recipientId = datatx.recipientId // may not exist
    let recipient = this.walletsByAddress[recipientId]

    if (!recipient && recipientId) { // cold wallet
      recipient = new Wallet(recipientId)
      emitter.emit('wallet:cold:created', recipient)
      this.walletsByAddress[recipientId] = recipient
    }

    if (datatx.type === TRANSACTION_TYPES.DELEGATE && this.delegatesByUsername[datatx.asset.delegate.username.toLowerCase()]) {
      logger.error(`Delegate transction sent by ${sender.address}`, JSON.stringify(datatx))

      throw new Error(`Can't apply transaction ${datatx.id}: delegate name already taken`)
    } else if (datatx.type === TRANSACTION_TYPES.VOTE && !this.walletsByPublicKey[datatx.asset.votes[0].slice(1)].username) {
      logger.error(`Vote transaction sent by ${sender.address}`, JSON.stringify(datatx))

      throw new Error(`Can't apply transaction ${datatx.id}: voted delegate does not exist`)
    }

    if (config.network.exceptions[datatx.id]) {
      logger.warn('Transaction forcibly applied because it has been added as an exception:', datatx)
    } else if (!sender.canApply(datatx)) {
      // TODO: What is this logging? Reduce?
      logger.info(JSON.stringify(sender))
      logger.error(`Can't apply transaction for ${sender.address}`, JSON.stringify(datatx))
      logger.info('Audit', JSON.stringify(sender.auditApply(datatx), null, 2))
      throw new Error(`Can't apply transaction ${datatx.id}`)
    }

    sender.applyTransactionToSender(datatx)

    if (datatx.type === TRANSACTION_TYPES.TRANSFER) {
      recipient.applyTransactionToRecipient(datatx)
    }
    // TODO: faster way to maintain active delegate list (ie instead of db queries)
    // if (sender.vote) {
    //   const delegateAdress = crypto.getAddress(transaction.data.asset.votes[0].slice(1), config.network.pubKeyHash)
    //   const delegate = this.localwallets[delegateAdress]
    //   delegate.applyVote(sender, transaction.data.asset.votes[0])
    // }
    return transaction
  }

  /**
   * Remove the given transaction from a delegate.
   * @param  {Transaction} transaction
   * @return {Transaction}
   */
  async undoTransaction (transaction) {
    let sender = this.walletsByPublicKey[transaction.data.senderPublicKey] // should exist
    let recipient = this.walletsByAddress[transaction.data.recipientId]
    sender.undoTransactionToSender(transaction.data)

    if (recipient && transaction.type === TRANSACTION_TYPES.TRANSFER) {
      recipient.undoTransactionToRecipient(transaction.data)
    }

    return transaction.data
  }

  /**
   * Get a wallet by the given address.
   * @param  {String} address
   * @return {(Wallet|null)}
   */
  getWalletByAddress (address) {
    let wallet = this.walletsByAddress[address]

    if (!wallet) {
      if (!crypto.validateAddress(address, config.network.pubKeyHash)) {
        return null
      }

      wallet = new Wallet(address)
      this.walletsByAddress[address] = wallet
    }

    return wallet
  }

  /**
   * Get a wallet by the given public key.
   * @param  {String} publicKey
   * @return {Wallet}
   */
  getWalletByPublicKey (publicKey) {
    let wallet = this.walletsByPublicKey[publicKey]

    if (!wallet) {
      const address = crypto.getAddress(publicKey, config.network.pubKeyHash)

      wallet = this.getWalletByAddress(address)
      wallet.publicKey = publicKey

      this.walletsByPublicKey[publicKey] = wallet
    }

    return wallet
  }

  /**
   * Get a delegate by the given username.
   * @param  {String} username
   * @return {Wallet}
   */
  getDelegate (username) {
    return this.delegatesByUsername[username]
  }

  /**
   * Get all wallets by address.
   * @return {Array}
   */
  getLocalWallets () { // for compatibility with API
    return Object.values(this.walletsByAddress)
  }
}
