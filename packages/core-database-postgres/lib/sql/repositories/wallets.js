const Repository = require('./repository')
const { Wallet } = require('../models')
const { wallets: sql } = require('../queries')

module.exports = class WalletsRepository extends Repository {
  async all () {
    return this.db.manyOrNone(sql.all)
  }

  async findByAddress (address) {
    return this.db.many(sql.findByAddress, [address])
  }

  async roundDelegates () {
    return this.db.many(sql.roundDelegates)
  }

  async roundFillers (amount) {
    return this.db.many(sql.roundFillers, [amount])
  }

  async roundFillersExcept (amount, delegates) {
    return this.db.many(sql.roundFillersExcept, [amount, delegates])
  }

  get model () {
    return Wallet
  }
}
