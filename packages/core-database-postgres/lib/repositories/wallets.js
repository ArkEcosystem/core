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
    return this.db.many(sql.findByAddress, [address])
  }

  /**
   * Get the model related to this repository.
   * @return {Object}
   */
  get model () {
    return new Wallet(this.db.$config.pgp)
  }
}
