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
   * Get all of the delegates for the current round.
   * @return {Promise}
   */
  async delegates () {
    return this.db.manyOrNone(sql.delegates)
  }

  /**
   * Get all of the delegate placeholders for the current round.
   * @param  {Number} limit
   * @return {Promise}
   */
  async placeholders (limit) {
    return this.db.many(sql.placeholders, { limit })
  }

  /**
   * Get all of the delegate placeholders for the current round. This excludes
   * already selected delegates from the initial pick & choose.
   * @param  {Number} limit
   * @param  {Array} publicKeys
   * @return {Promise}
   */
  async placeholdersWithout (limit, publicKeys) {
    return this.db.many(sql.placeholdersWithout, { limit, publicKeys })
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
