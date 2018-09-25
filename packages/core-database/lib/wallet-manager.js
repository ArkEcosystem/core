'use strict'

const Promise = require('bluebird')

const { Bignum, crypto } = require('@arkecosystem/crypto')
const { Wallet } = require('@arkecosystem/crypto').models
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')

module.exports = class WalletManager {
  /**
   * Create a new wallet manager instance.
   * @constructor
   */
  constructor () {
    this.exceptions = config ? config.network.exceptions : {}
    this.networkId = config ? config.network.pubKeyHash : 0x17
    this.reset()
  }

  /**
   * Reset the wallets index.
   * @return {void}
   */
  reset () {
    this.byAddress = {}
    this.byPublicKey = {}
    this.byUsername = {}
  }

  /**
   * Get all wallets by address.
   * @return {Array}
   */
  all () {
    return Object.values(this.byAddress)
  }

  /**
   * Get all wallets by publicKey.
   * @return {Array}
   */
  allByPublicKey () {
    return Object.values(this.byPublicKey)
  }

  /**
   * Get all wallets by username.
   * @return {Array}
   */
  allByUsername () {
    return Object.values(this.byUsername)
  }

  /**
   * Find a wallet by the given address.
   * @param  {String} address
   * @return {Wallet}
   */
  findByAddress (address) {
    if (!this.byAddress[address]) {
      this.byAddress[address] = new Wallet(address)
    }

    return this.byAddress[address]
  }

  /**
   * Find a wallet by the given public key.
   * @param  {String} publicKey
   * @return {Wallet}
   */
  findByPublicKey (publicKey) {
    if (!this.byPublicKey[publicKey]) {
      const address = crypto.getAddress(publicKey, config.network.pubKeyHash)

      const wallet = this.findByAddress(address)
      wallet.publicKey = publicKey
      this.byPublicKey[publicKey] = wallet
    }

    return this.byPublicKey[publicKey]
  }

  /**
   * Find a wallet by the given username.
   * @param  {String} username
   * @return {Wallet}
   */
  findByUsername (username) {
    return this.byUsername[username]
  }

  /**
   * Set wallet by address.
   * @param {String} address
   * @param {Wallet} wallet
   * @param {void}
   */
  setByAddress (address, wallet) {
    this.byAddress[address] = wallet
  }

  /**
   * Set wallet by publicKey.
   * @param {String} publicKey
   * @param {Wallet} wallet
   * @param {void}
   */
  setByPublicKey (publicKey, wallet) {
    this.byPublicKey[publicKey] = wallet
  }

  /**
   * Set wallet by username.
   * @param {String} username
   * @param {Wallet} wallet
   * @param {void}
   */
  setByUsername (username, wallet) {
    this.byUsername[username] = wallet
  }

  /**
   * Remove wallet by address.
   * @param {String} address
   * @param {void}
   */
  forgetByAddress (address) {
    delete this.byAddress[address]
  }

  /**
   * Remove wallet by publicKey.
   * @param {String} publicKey
   * @param {void}
   */
  forgetByPublicKey (publicKey) {
    delete this.byPublicKey[publicKey]
  }

  /**
   * Remove wallet by username.
   * @param {String} username
   * @param {void}
   */
  forgetByUsername (username) {
    delete this.byUsername[username]
  }

  /**
   * Index the given wallets.
   * @param  {Array} wallets
   * @return {void}
   */
  index (wallets) {
    for (const wallet of wallets) {
      this.reindex(wallet)
    }
  }

  /**
   * Reindex the given wallet.
   * @param  {Wallet} wallet
   * @return {void}
   */
  reindex (wallet) {
    if (wallet.address) {
      this.byAddress[wallet.address] = wallet
    }

    if (wallet.publicKey) {
      this.byPublicKey[wallet.publicKey] = wallet
    }

    if (wallet.username) {
      this.byUsername[wallet.username] = wallet
    }
  }

  clear () {
    Object.values(this.byAddress).map(wallet => (wallet.dirty = false))
  }

  /**
   * Update the vote balances of delegates.
   * @return {void}
   */
  updateDelegates () {
    Object.values(this.byUsername).forEach(delegate => (delegate.voteBalance = Bignum.ZERO))
    Object.values(this.byPublicKey)
      .filter(voter => !!voter.vote)
      .forEach(voter => {
        const delegate = this.byPublicKey[voter.vote]
        delegate.voteBalance = delegate.voteBalance.plus(voter.balance)
      })
    Object.values(this.byUsername)
      .sort((a, b) => (b.voteBalance.toNumber() - a.voteBalance.toNumber()))
      .forEach((delegate, index) => (delegate.rate = index + 1))
  }

  /**
   * Remove non-delegate wallets that have zero (0) balance from memory.
   * @return {void}
   */
  purgeEmptyNonDelegates () {
    Object.values(this.byPublicKey).forEach(wallet => {
      if (this.__canBePurged(wallet)) {
        delete this.byPublicKey[wallet.publicKey]
        delete this.byAddress[wallet.address]
      }
    })
  }

  /**
   * Apply the given block to a delegate.
   * @param  {Block} block
   * @return {void}
   */
  applyBlock (block) {
    const generatorPublicKey = block.data.generatorPublicKey

    let delegate = this.byPublicKey[block.data.generatorPublicKey]

    if (!delegate) {
      const generator = crypto.getAddress(generatorPublicKey, this.networkId)

      if (block.data.height === 1) {
        delegate = new Wallet(generator)
        delegate.publicKey = generatorPublicKey

        this.reindex(delegate)
      } else {
        logger.debug(`Delegate by address: ${this.byAddress[generator]}`)

        if (this.byAddress[generator]) {
          logger.info('This look like a bug, please report :bug:')
        }

        throw new Error(`Could not find delegate with publicKey ${generatorPublicKey}`)
      }
    }

    const appliedTransactions = []

    try {
      for (let i = 0; i < block.transactions.length; i++) {
        this.applyTransaction(block.transactions[i])

        appliedTransactions.push(block.transactions[i])
      }

      delegate.applyBlock(block.data)
    } catch (error) {
      logger.error('Failed to apply all transactions in block - reverting previous transactions')
      // Revert the applied transactions from last to first
      for (let i = appliedTransactions.length - 1; i >= 0; i--) {
        this.revertTransaction(appliedTransactions[i])
      }

      // TODO: should revert the delegate applyBlock ?
      // TBC: whatever situation `delegate.applyBlock(block.data)` is never applied

      throw error
    }
  }

  /**
   * Remove the given block from a delegate.
   * @param  {Block} block
   * @return {void}
   */
  async revertBlock (block) {
    let delegate = this.byPublicKey[block.data.generatorPublicKey]

    if (!delegate) {
      const generator = crypto.getAddress(block.data.generatorPublicKey, this.networkId)

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
  applyTransaction (transaction) { /* eslint padded-blocks: "off" */
    const { data } = transaction
    const { type, asset, recipientId, senderPublicKey } = data

    const sender = this.findByPublicKey(senderPublicKey)
    const recipient = this.findByAddress(recipientId)

    if (type === TRANSACTION_TYPES.DELEGATE_REGISTRATION && this.byUsername[asset.delegate.username.toLowerCase()]) {

      logger.error(`Can't apply transaction ${data.id}: delegate name already taken.`, JSON.stringify(data))
      throw new Error(`Can't apply transaction ${data.id}: delegate name already taken.`)

    // NOTE: We use the vote public key, because vote transactions have the same sender and recipient
    } else if (type === TRANSACTION_TYPES.VOTE && !this.__isDelegate(asset.votes[0].slice(1))) {

      logger.error(`Can't apply vote transaction: delegate ${asset.votes[0]} does not exist.`, JSON.stringify(data))
      throw new Error(`Can't apply transaction ${data.id}: delegate ${asset.votes[0]} does not exist.`)

    } else if (type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
      data.recipientId = ''
    } else if (this.exceptions[data.id]) {

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

    return transaction
  }

  /**
   * Remove the given transaction from a delegate.
   * @param  {Number} type
   * @param  {Object} data
   * @return {Transaction}
   */
  revertTransaction ({ type, data }) {
    const sender = this.findByPublicKey(data.senderPublicKey) // Should exist
    const recipient = this.byAddress[data.recipientId]

    sender.revertTransactionForSender(data)

    // removing the wallet from the delegates index
    if (data.type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
      delete this.byUsername[data.asset.delegate.username]
    }

    if (recipient && type === TRANSACTION_TYPES.TRANSFER) {
      recipient.revertTransactionForRecipient(data)
    }

    return data
  }

  /**
   * Checks if a given publicKey is a registered delegate
   * @param {String} publicKey
   */
  __isDelegate (publicKey) {
    const delegateWallet = this.byPublicKey[publicKey]
    if (delegateWallet && delegateWallet.username) {
      return !!this.byUsername[delegateWallet.username]
    }

    return false
  }

  /**
   * Determine if the wallet can be removed from memory.
   * @param  {Object} wallet
   * @return {Boolean}
   */
  __canBePurged (wallet) {
    return wallet.balance.isZero() && !wallet.secondPublicKey && !wallet.multisignature && !wallet.username
  }

}
