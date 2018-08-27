'use strict'

const Promise = require('bluebird')

const { map, orderBy, sumBy } = require('lodash')
const { crypto } = require('@arkecosystem/crypto')
const { Wallet } = require('@arkecosystem/crypto').models
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')

const genesisWallets = map(config.genesisBlock.transactions, 'senderId')

module.exports = class WalletManager {
  /**
   * Create a new wallet manager instance.
   * @constructor
   */
  constructor () {
    this.reset()

    this.emitEvents = true
  }

  /**
   * Reset the wallets index.
   * @return {void}
   */
  reset () {
    // TODO rename to by...
    this.walletsByAddress = {}
    this.walletsByPublicKey = {}
    this.walletsByUsername = {}
  }

  /**
   * Index the given wallets.
   * @param  {Array} wallets
   * @return {void}
   */
  index (wallets) {
    wallets.forEach(wallet => this.reindex(wallet))
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
      this.walletsByUsername[wallet.username] = wallet
    }
  }

  /**
   * Update the vote balances and ranks of delegates.
   * @return {void}
   */
  async updateDelegates () {
    let delegates = this.getDelegates().map(delegate => {
      const voters = this
        .getLocalWallets()
        .filter(w => w.vote === delegate.publicKey)

      delegate.votebalance = sumBy(voters, 'balance')

      return delegate
    })

    delegates = orderBy(delegates, ['votebalance'], ['desc']).map((delegate, index) => {
      delegate.rate = index + 1

      return delegate
    })

    this.index(delegates)
  }

  /**
   * Used to determine if a wallet is a Genesis wallet.
   * @return {Boolean}
   */
  isGenesis (wallet) {
    return genesisWallets.includes(wallet.address)
  }

  /**
   * Remove non-delegate wallets that have zero (0) balance from memory.
   * @return {void}
   */
  purgeEmptyNonDelegates () {
    Object.keys(this.walletsByPublicKey).forEach(publicKey => {
      const wallet = this.walletsByPublicKey[publicKey]

      if (this.__canBePurged(wallet)) {
        delete this.walletsByPublicKey[publicKey]
        delete this.walletsByAddress[wallet.address]
      }
    })
  }

  /**
   * Apply the given block to a delegate.
   * @param  {Block} block
   * @return {void}
   */
  async applyBlock (block) {
    const generatorPublicKey = block.data.generatorPublicKey

    let delegate = this.getWalletByPublicKey(block.data.generatorPublicKey)

    if (!delegate) {
      const generator = crypto.getAddress(generatorPublicKey, config.network.pubKeyHash)

      if (block.data.height === 1) {
        delegate = new Wallet(generator)
        delegate.publicKey = generatorPublicKey

        this.reindex(delegate)
      } else {
        logger.debug(`Delegate by address: ${this.walletsByAddress[generator]}`)

        if (this.walletsByAddress[generator]) {
          logger.info('This look like a bug, please report :bug:')
        }

        throw new Error(`Could not find delegate with publicKey ${generatorPublicKey}`)
      }
    }

    const appliedTransactions = []

    try {
      for (let i = 0; i < block.transactions.length; i++) {
        await this.applyTransaction(block.transactions[i])

        appliedTransactions.push(block.transactions[i])
      }

      delegate.applyBlock(block.data)
    } catch (error) {
      logger.error('Failed to apply all transactions in block - reverting previous transactions')

      // Revert the applied transactions from last to first
      for (let i = appliedTransactions.length - 1; i >= 0; i--) {
        await this.revertTransaction(appliedTransactions[i])
      }

      // TODO should revert the delegate applyBlock ?

      throw error
    }
  }

  /**
   * Remove the given block from a delegate.
   * @param  {Block} block
   * @return {void}
   */
  async revertBlock (block) {
    let delegate = this.getWalletByPublicKey(block.data.generatorPublicKey)

    if (!delegate) {
      const generator = crypto.getAddress(block.data.generatorPublicKey, config.network.pubKeyHash)

      delegate = new Wallet(generator)
      delegate.publicKey = block.data.generatorPublicKey

      this.reindex(delegate)
    }

    const revertedTransactions = []

    try {
      await Promise.each(block.transactions, async (transaction) => {
        await this.revertTransaction(transaction)

        revertedTransactions.push(transaction)
      })

      delegate.revertBlock(block.data)
    } catch (error) {
      logger.error(error.stack)

      await Promise.each(revertedTransactions, async (transaction) => this.applyTransaction(transaction))

      throw error
    }
  }

  /**
   * Apply the given transaction to a delegate.
   * @param  {Transaction} transaction
   * @return {Transaction}
   */
  async applyTransaction (transaction) { /* eslint padded-blocks: "off" */
    const { data } = transaction
    const { type, asset, recipientId, senderPublicKey } = data

    const sender = this.getWalletByPublicKey(senderPublicKey)
    let recipient = recipientId ? this.getWalletByAddress(recipientId) : null

    if (!recipient && recipientId) { // cold wallet
      recipient = new Wallet(recipientId)
      this.walletsByAddress[recipientId] = recipient
      this.__emitEvent('wallet:cold:created', recipient)
    }

    if (type === TRANSACTION_TYPES.DELEGATE_REGISTRATION && this.walletsByUsername[asset.delegate.username.toLowerCase()]) {

      logger.error(`Can't apply transaction ${data.id}: delegate name already taken.`, JSON.stringify(data))
      throw new Error(`Can't apply transaction ${data.id}: delegate name already taken.`)

    // NOTE: We use the vote public key, because vote transactions have the same sender and recipient
    } else if (type === TRANSACTION_TYPES.VOTE && !this.__isDelegate(asset.votes[0].slice(1))) {

      logger.error(`Can't apply vote transaction: delegate ${asset.votes[0]} does not exist.`, JSON.stringify(data))
      throw new Error(`Can't apply transaction ${data.id}: delegate ${asset.votes[0]} does not exist.`)

    } else if (config.network.exceptions[data.id]) {

      logger.warn('Transaction forcibly applied because it has been added as an exception:', data)

    } else if (!sender.canApply(data)) {

      logger.error(`Can't apply transaction for ${sender.address}`, JSON.stringify(data))
      logger.debug('Audit', JSON.stringify(sender.auditApply(data), null, 2))
      throw new Error(`Can't apply transaction ${data.id}`)
    }

    sender.applyTransactionToSender(data)

    if (type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
      this.reindex(sender)
    }

    if (recipient && type === TRANSACTION_TYPES.TRANSFER) {
      recipient.applyTransactionToRecipient(data)
    }

    this.__emitTransactionEvents(transaction)

    return transaction
  }

  /**
   * Remove the given transaction from a delegate.
   * @param  {Number} type
   * @param  {Object} data
   * @return {Transaction}
   */
  async revertTransaction ({ type, data }) {
    const sender = this.getWalletByPublicKey(data.senderPublicKey) // Should exist
    const recipient = this.getWalletByAddress(data.recipientId)

    sender.revertTransactionForSender(data)

    // removing the wallet from the delegates index
    if (data.type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
      this.walletsByUsername[data.asset.delegate.username] = null
    }

    if (recipient && type === TRANSACTION_TYPES.TRANSFER) {
      recipient.revertTransactionForRecipient(data)
    }

   this.__emitEvent('transaction.reverted', data)

    return data
  }

  /**
   * Get a wallet by the given address.
   * @param  {String} address
   * @return {(Wallet|null)}
   */
  getWalletByAddress (address) {
    if (!this.walletsByAddress[address]) {
      this.walletsByAddress[address] = new Wallet(address)
    }

    return this.walletsByAddress[address]
  }

  /**
   * Get a wallet by the given public key.
   * @param  {String} publicKey
   * @return {Wallet}
   */
  getWalletByPublicKey (publicKey) {
    if (!this.walletsByPublicKey[publicKey]) {
      const address = crypto.getAddress(publicKey, config.network.pubKeyHash)

      this.walletsByPublicKey[publicKey] = this.getWalletByAddress(address)
      this.walletsByPublicKey[publicKey].publicKey = publicKey
    }

    return this.walletsByPublicKey[publicKey]
  }

  /**
   * Get a wallet by the given username.
   * @param  {String} publicKey
   * @return {Wallet}
   */
  getWalletByUsername (username) {
    return this.walletsByUsername[username]
  }

  /**
   * Getter for "walletsByUsername" for clear intent.
   * @return {Wallet}
   */
  getDelegates () {
    return Object.values(this.walletsByUsername)
  }

  /**
   * Get all wallets by address.
   * @return {Array}
   */
  getLocalWallets () { // for compatibility with API
    return Object.values(this.walletsByAddress)
  }

  /**
   * Get all wallets by publicKey.
   * @return {Array}
   */
  getLocalWalletsByPublicKey () { // for init of transaction pool manager
    return Object.values(this.walletsByPublicKey)
  }

  /**
   * Checks if a given publicKey is a registered delegate
   * @param {String} publicKey
   */
  __isDelegate (publicKey) {
    const delegateWallet = this.walletsByPublicKey[publicKey]
    if (delegateWallet && delegateWallet.username) {
      return !!this.walletsByUsername[delegateWallet.username]
    }

    return false
  }

  /**
   * Determine if the wallet can be removed from memory.
   * @param  {Object} wallet
   * @return {Boolean}
   */
  __canBePurged (wallet) {
    return wallet.balance === 0 && !wallet.secondPublicKey && !wallet.multisignature && !wallet.username
  }

  /**
   * Emit events to the emmiter
   * @param  {String} event
   * @param {Object} date
   * @return {void}
   */
  __emitEvent (event, data) {
    if (this.emitEvents) {
      emitter.emit(event, data)
    }
  }

  /**
   * Emit events for the specified transaction.
   * @param  {Object} transaction
   * @return {void}
   */
  __emitTransactionEvents (transaction) {
   this.__emitEvent('transaction.applied', transaction.data)

    if (transaction.type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
     this.__emitEvent('delegate.registered', transaction.data)
    }

    if (transaction.type === TRANSACTION_TYPES.DELEGATE_RESIGNATION) {
     this.__emitEvent('delegate.resigned', transaction.data)
    }

    if (transaction.type === TRANSACTION_TYPES.VOTE) {
      const vote = transaction.asset.votes[0]

     this.__emitEvent(vote.startsWith('+') ? 'wallet.vote' : 'wallet.unvote', {
        delegate: vote,
        transaction: transaction.data
      })
    }
  }
}
