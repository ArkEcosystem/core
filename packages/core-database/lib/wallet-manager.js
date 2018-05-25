'use strict'

const Promise = require('bluebird')

const { crypto } = require('@arkecosystem/crypto')
const { Wallet } = require('@arkecosystem/crypto').models
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')

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
      // TODO Use Promise.all or explain why not
      // - Promise.each is applied sequentially
      // - Promise.all is applied in parallel
      await Promise.each(block.transactions, async (transaction) => {
        await this.revertTransaction(transaction)

        revertedTransactions.push(transaction)
      })

      delegate.revertBlock(block.data)
    } catch (error) {
      logger.error(error.stack)

      // TODO Use Promise.all or explain why not
      // - Promise.each is applied sequentially
      // - Promise.all is applied in parallel
      await Promise.each(revertedTransactions, async (transaction) => this.applyTransaction(transaction))

      throw error
    }
  }

  /**
   * Apply the given transaction to a delegate.
   * @param  {Transaction} transaction
   * @return {Transaction}
   */
  async applyTransaction (transaction) {
    const transactionData = transaction.data
    const recipientId = transactionData.recipientId

    const sender = this.getWalletByPublicKey(transactionData.senderPublicKey)
    let recipient = recipientId ? this.getWalletByAddress(recipientId) : null

    if (!recipient && recipientId) { // cold wallet
      recipient = new Wallet(recipientId)
      this.walletsByAddress[recipientId] = recipient
      emitter.emit('wallet:cold:created', recipient)
    } else if (transactionData.type === TRANSACTION_TYPES.DELEGATE_REGISTRATION && this.walletsByUsername[transactionData.asset.delegate.username.toLowerCase()]) {
      logger.error(`Delegate transction sent by ${sender.address}`, JSON.stringify(transactionData))

      throw new Error(`Can't apply transaction ${transactionData.id}: delegate name already taken`)
    } else if (transactionData.type === TRANSACTION_TYPES.VOTE && !this.walletsByPublicKey[transactionData.asset.votes[0].slice(1)].username) {
      logger.error(`Vote transaction sent by ${sender.address}`, JSON.stringify(transactionData))

      throw new Error(`Can't apply transaction ${transactionData.id}: voted delegate does not exist`)
    } else if (config.network.exceptions[transactionData.id]) {
      logger.warn('Transaction forcibly applied because it has been added as an exception:', transactionData)
    } else if (!sender.canApply(transactionData)) {
      logger.error(`Can't apply transaction for ${sender.address}`, JSON.stringify(transactionData))
      logger.debug('Audit', JSON.stringify(sender.auditApply(transactionData), null, 2))

      throw new Error(`Can't apply transaction ${transactionData.id}`)
    }

    sender.applyTransactionToSender(transactionData)

    if (recipient && transactionData.type === TRANSACTION_TYPES.TRANSFER) {
      recipient.applyTransactionToRecipient(transactionData)
    }

    this.__emitEvents(transaction)

    if (transactionData.type === TRANSACTION_TYPES.VOTE) {
      this.__updateVoteBalance(transaction)
    }

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

    if (recipient && type === TRANSACTION_TYPES.TRANSFER) {
      recipient.revertTransactionForRecipient(data)
    }

    emitter.emit('transaction.reverted', data)

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
   * Get all wallets by address.
   * @return {Array}
   */
  getLocalWallets () { // for compatibility with API
    return Object.values(this.walletsByAddress)
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
   * Emit events for the specified transaction.
   * @param  {Object} transaction
   * @return {void}
   */
  __emitEvents (transaction) {
    emitter.emit('transaction.applied', transaction.data)

    if (transaction.type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
      emitter.emit('delegate.registered', transaction.data)
    }

    if (transaction.type === TRANSACTION_TYPES.DELEGATE_RESIGNATION) {
      emitter.emit('delegate.resigned', transaction.data)
    }

    if (transaction.type === TRANSACTION_TYPES.VOTE) {
      transaction.asset.votes.forEach(vote => {
        emitter.emit(vote.startsWith('+') ? 'wallet.vote' : 'wallet.unvote', {
          delegate: vote,
          transaction: transaction.data
        })
      })
    }
  }

  /**
   * Update the vote balance of the delegate.
   * @param  {Object} transaction
   * @return {void}
   */
  __updateVoteBalance (transaction) {
    const vote = transaction.data.asset.votes[0]

    const voter = this.getWalletByPublicKey(transaction.data.senderPublicKey)
    const delegate = this.getWalletByPublicKey(vote.slice(1))

    if (vote.startsWith('+')) {
      delegate.votebalance += voter.balance

      logger.debug(`Delegate ${delegate.username} vote balance increased by ${voter.balance} to ${delegate.votebalance}`)
    } else {
      delegate.votebalance -= voter.balance

      logger.debug(`Delegate ${delegate.username} vote balance decreased by ${voter.balance} to ${delegate.votebalance}`)
    }

    this.reindex(delegate)
  }
}
