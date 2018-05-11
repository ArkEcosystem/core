const reject = require('lodash/reject')
const { crypto } = require('@arkecosystem/client')
const { Transaction } = require('@arkecosystem/client').models

module.exports = class TransactionGuard {
  constructor (pool) {
    this.pool = pool

    this.__reset()
  }

  async validate (transactions) {
    this.__reset()

    this.__prepareTransactions(transactions)

    this.__determineInvalidTransactions()

    this.__determineExcessTransactions()
  }

  getIds (type = null) {
    if (type) {
      return this[type].map(transaction => transaction.id)
    }

    return {
      transactions: this.transactions.map(transaction => transaction.id),
      accept: this.accept.map(transaction => transaction.id),
      excess: this.excess.map(transaction => transaction.id),
      invalid: this.invalid.map(transaction => transaction.id)
    }
  }

  getTransactions (type = null) {
    return {
      transactions: this.transactions,
      accept: this.accept,
      excess: this.excess,
      invalid: this.invalid
    }
  }

  has (type, count) {
    return this.hasAny(type) === count
  }

  hasAtLeast (type, count) {
    return this.hasAny(type) >= count
  }

  hasAny (type) {
    return this[type].length
  }

  __prepareTransactions (transactions) {
    this.transactions = transactions
      .map(transaction => Transaction.serialize(transaction).toString('hex'))
      .map(transaction => Transaction.deserialize(transaction))
  }

  __determineInvalidTransactions () {
    this.transactions = reject(this.transactions, transaction => {
      const wallet = this.pool.walletManager.getWalletByPublicKey(transaction.senderPublicKey)
      const verified = crypto.verify(transaction) && wallet.canApply(transaction)

      if (!verified) {
        this.invalid.push(transaction)
      }

      return !verified
    })
  }

  async __determineExcessTransactions () {
    const transactions = await this.pool.determineExcessTransactions(this.transactions)

    this.accept = transactions.accept
    this.excess = transactions.excess
  }

  __reset () {
    this.transactions = []
    this.accept = []
    this.excess = []
    this.invalid = []
  }
}
