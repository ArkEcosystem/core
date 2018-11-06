const Repository = require('./repository')
const { Transaction } = require('../models')
const { transactions: sql } = require('../queries')

module.exports = class TransactionsRepository extends Repository {
  /**
   * Find a transactions by its ID.
   * @param  {String} id
   * @return {Promise}
   */
  async findById (id) {
    return this.db.one(sql.findById, { id })
  }

  /**
   * Find multiple transactionss by their IDs.
   * @param  {Array} ids
   * @return {Promise}
   */
  async findManyById (ids) {
    return this.db.manyOrNone(sql.findManyById, { ids })
  }

  /**
   * Find multiple transactionss by their block ID.
   * @param  {String} id
   * @return {Promise}
   */
  async findByBlock (id) {
    return this.db.manyOrNone(sql.findByBlock, { id })
  }

  /**
   * Find multiple transactionss by their block ID and order them by sequence.
   * @param  {Number} id
   * @return {Promise}
   */
  async latestByBlock (id) {
    return this.db.manyOrNone(sql.latestByBlock, { id })
  }

  /**
   * Find multiple transactionss by their block IDs and order them by sequence.
   * @param  {Array} ids
   * @return {Promise}
   */
  async latestByBlocks (ids) {
    return this.db.manyOrNone(sql.latestByBlocks, { ids })
  }

  /**
   * Get all of the forged transactions from the database.
   * @param  {Array} ids
   * @return {Promise}
   */
  async forged (ids) {
    return this.db.manyOrNone(sql.forged, { ids })
  }

  /**
   * Get statistics about all transactions from the database.
   * @return {Promise}
   */
  async statistics () {
    return this.db.one(sql.statistics)
  }

  /**
   * Delete the transactions from the database.
   * @param  {Number} id
   * @return {Promise}
   */
  async deleteByBlock (id) {
    return this.db.none(sql.deleteByBlock, { id })
  }

  /**
   * Get the model related to this repository.
   * @return {Object}
   */
  getModel () {
    return new Transaction(this.pgp)
  }
}
