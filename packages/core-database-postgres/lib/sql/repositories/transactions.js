const Repository = require('./repository')
const { Transaction } = require('../models')
const { transactions: sql } = require('../queries')

module.exports = class TransactionsRepository extends Repository {
  async findByBlock (id) {
    return this.db.manyOrNone(sql.findByBlock, [id])
  }

  async latestByBlock (id) {
    return this.db.manyOrNone(sql.latestByBlock, [id])
  }

  async latestByBlocks (ids) {
    return this.db.manyOrNone(sql.latestByBlocks, [ids.join(',')])
  }

  async statistics () {
    return this.db.one(sql.statistics)
  }

  async deleteByBlock (id) {
    return this.db.none(sql.deleteByBlock, [id])
  }

  async forged (id) {
    return this.db.many(sql.forged)
  }

  async findById (ids) {
    return this.db.one(sql.findById, [ids.join(',')])
  }

  async findManyById (ids) {
    return this.db.many(sql.findManyById, [ids.join(',')])
  }

  get model () {
    return Transaction
  }
}
