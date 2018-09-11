'use strict'

const Promise = require('bluebird')

const { orderBy, sumBy } = require('lodash')
const { crypto } = require('@arkecosystem/crypto')
const { Wallet } = require('@arkecosystem/crypto').models
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const storage = container.resolvePlugin('storage')

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
    storage.forget([
      'walletsByAddress',
      'walletsByPublicKey',
      'walletsByUsername'
    ])

    this.byAddress = storage.setMap('walletsByAddress')
    this.byPublicKey = storage.setMap('walletsByPublicKey')
    this.byUsername = storage.setMap('walletsByUsername')
  }

  /**
   * Get all wallets by address.
   * @return {Array}
   */
  all () {
    return this.byAddress.valueSeq().toArray()
  }

  /**
   * Get all wallets by publicKey.
   * @return {Array}
   */
  allByPublicKey () {
    return this.byPublicKey.valueSeq().toArray()
  }

  /**
   * Get all wallets by username.
   * @return {Array}
   */
  allByUsername () {
    return this.byUsername.valueSeq().toArray()
  }

  /**
   * Find a wallet by the given address.
   * @param  {String} address
   * @return {Wallet}
   */
  findByAddress (address) {
    if (!this.byAddress.get(address)) {
      this.setByAddress(address, new Wallet(address))
    }

    return this.byAddress.get(address)
  }

  /**
   * Find a wallet by the given public key.
   * @param  {String} publicKey
   * @return {Wallet}
   */
  findByPublicKey (publicKey) {
    if (!this.byPublicKey.get(publicKey)) {
      const address = crypto.getAddress(publicKey, config.network.pubKeyHash)

      const wallet = this.findByAddress(address)
      wallet.publicKey = publicKey
      this.setByPublicKey(publicKey, wallet)
    }

    return this.byPublicKey.get(publicKey)
  }

  /**
   * Find a wallet by the given username.
   * @param  {String} username
   * @return {Wallet}
   */
  findByUsername (username) {
    return this.byUsername.get(username)
  }

  /**
   * Set wallet by address.
   * @param {String} address
   * @param {Wallet} wallet
   * @param {void}
   */
  setByAddress (address, wallet) {
    this.byAddress = this.byAddress.set(address, wallet)
  }

  /**
   * Set wallet by publicKey.
   * @param {String} publicKey
   * @param {Wallet} wallet
   * @param {void}
   */
  setByPublicKey (publicKey, wallet) {
    this.byPublicKey = this.byPublicKey.set(publicKey, wallet)
  }

  /**
   * Set wallet by username.
   * @param {String} username
   * @param {Wallet} wallet
   * @param {void}
   */
  setByUsername (username, wallet) {
    this.byUsername = this.byUsername.set(username, wallet)
  }

  /**
   * Remove wallet by address.
   * @param {String} address
   * @param {void}
   */
  forgetByAddress (address) {
    this.byAddress = this.byAddress.delete(address)
  }

  /**
   * Remove wallet by publicKey.
   * @param {String} publicKey
   * @param {void}
   */
  forgetByPublicKey (publicKey) {
    this.byPublicKey = this.byPublicKey.delete(publicKey)
  }

  /**
   * Remove wallet by username.
   * @param {String} username
   * @param {void}
   */
  forgetByUsername (username) {
    this.byUsername = this.byUsername.delete(username)
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
      this.setByAddress(wallet.address, wallet)
    }

    if (wallet.publicKey) {
      this.setByPublicKey(wallet.publicKey, wallet)
    }

    if (wallet.username) {
      this.setByUsername(wallet.username, wallet)
    }
  }

  clear () {
    this.byAddress.map(wallet => (wallet.dirty = false))
  }

  /**
   * Update the vote balances and ranks of delegates.
   * @return {void}
   */
  async updateDelegates () {
    let delegates = this.allByUsername().map(delegate => {
      const voters = this
        .all()
        .filter(w => w.vote === delegate.publicKey)

      delegate.voteBalance = sumBy(voters, 'balance')

      return delegate
    })

    delegates = orderBy(delegates, ['voteBalance'], ['desc']).map((delegate, index) => {
      delegate.rate = index + 1

      return delegate
    })

    this.index(delegates)
  }

  /**
   * Remove non-delegate wallets that have zero (0) balance from memory.
   * @return {void}
   */
  purgeEmptyNonDelegates () {
    this.allByPublicKey().forEach(wallet => {
      if (this.__canBePurged(wallet)) {
        this.forgetByPublicKey(wallet.publicKey)
        this.forgetByAddress(wallet.address)
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

    let delegate = this.findByPublicKey(block.data.generatorPublicKey)

    if (!delegate) {
      const generator = crypto.getAddress(generatorPublicKey, this.networkId)

      if (block.data.height === 1) {
        delegate = new Wallet(generator)
        delegate.publicKey = generatorPublicKey

        this.reindex(delegate)
      } else {
        logger.debug(`Delegate by address: ${this.byAddress.get(generator)}`)

        if (this.byAddress(generator)) {
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
    let delegate = this.findByPublicKey(block.data.generatorPublicKey)

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

    if (type === TRANSACTION_TYPES.DELEGATE_REGISTRATION && this.byUsername.get(asset.delegate.username.toLowerCase())) {

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
    const recipient = this.findByAddress(data.recipientId)

    sender.revertTransactionForSender(data)

    // removing the wallet from the delegates index
    if (data.type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
      this.forgetByUsername(data.asset.delegate.username)
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
    const delegateWallet = this.byPublicKey.get(publicKey)
    if (delegateWallet && delegateWallet.username) {
      return !!this.byUsername.get(delegateWallet.username)
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

}
