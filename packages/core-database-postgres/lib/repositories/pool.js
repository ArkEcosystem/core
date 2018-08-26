const Repository = require('./repository')
const { Pool } = require('../models')
const { pool: sql } = require('../queries')

module.exports = class PoolRepository extends Repository {
  /**
   * Delete transactions from the pool given their ids.
   * @param  {Array} ids
   * @return {Promise}
   */
  async delete (ids) {
    return this.db.none(sql.delete, { ids })
  }

  /**
   * Load all transactions from the pool.
   * @return {Promise}
   */
  async load () {
    return this.db.any(sql.load)
  }

  /**
   * Get the model related to this repository.
   * @return {Object}
   */
  getModel () {
    return new Pool(this.pgp)
  }
}
