const Repository = require('./repository')
const { Wallet } = require('../models')
const { wallets: sql } = require('../queries')

module.exports = class WalletsRepository extends Repository {
  /**
   * Get all of the wallets from the database.
   * @return {Promise}
   */
  async all () {
    return this.db.manyOrNone(sql.all)
  }

  /**
   * Find a wallet by its address.
   * @param  {String} address
   * @return {Promise}
   */
  async findByAddress (address) {
    return this.db.oneOrNone(sql.findByAddress, { address })
  }

  /**
   * Create or update a record matching the attributes, and fill it with values.
   * @param  {Object} wallet
   * @return {Promise}
   */
  async updateOrCreate (wallet) {
    const query = this.__insertQuery(wallet) +
      ' ON CONFLICT(address) DO UPDATE SET ' +
      this.pgp.helpers.sets(wallet, this.model.getColumnSet())

    return this.db.none(query)
  }

  /**
   * Get the model related to this repository.
   * @return {Object}
   */
  getModel () {
    return new Wallet(this.pgp)
  }
}
