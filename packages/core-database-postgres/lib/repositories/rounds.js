const Repository = require('./repository')
const { Round } = require('../models')
const { rounds: sql } = require('../queries')

module.exports = class RoundsRepository extends Repository {
  /**
   * Find a round by its ID.
   * @param  {Number} round
   * @return {Promise}
   */
  async findById (round) {
    return this.db.manyOrNone(sql.find, { round })
  }

  /**
   * Delete the round from the database.
   * @param  {Number} round
   * @return {Promise}
   */
  async delete (round) {
    return this.db.none(sql.delete, { round })
  }

  /**
   * Get the model related to this repository.
   * @return {Object}
   */
  getModel () {
    return new Round(this.pgp)
  }
}
