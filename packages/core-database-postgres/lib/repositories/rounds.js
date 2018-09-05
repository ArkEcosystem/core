const Repository = require('./repository')
const { Round } = require('../models')
const { rounds: sql } = require('../queries')

module.exports = class RoundsRepository extends Repository {
  /**
   * Find a round by its ID.
   * @param  {Number} id
   * @return {Promise}
   */
  async findById (id) {
    return this.db.one(sql.find, [id])
  }

  /**
   * Get all of the delegates for the current round.
   * @return {Promise}
   */
  async delegates () {
    return this.db.many(sql.delegates)
  }

  /**
   * Get all of the delegate placeholders for the current round.
   * @param  {Number} amount
   * @return {Promise}
   */
  async placeholders (amount) {
    return this.db.many(sql.placeholders, [amount])
  }

  /**
   * Get all of the delegate placeholders for the current round. This excludes
   * already selected delegates from the initial pick & choose.
   * @param  {Number} amount
   * @param  {Array} delegates
   * @return {Promise}
   */
  async placeholdersWithout (amount, delegates) {
    return this.db.many(sql.placeholdersWithout, [amount, delegates.join(',')])
  }

  /**
   * Delete the round from the database.
   * @param  {Number} id
   * @return {Promise}
   */
  async delete (id) {
    return this.db.one(sql.delete, [id])
  }

  /**
   * Get the model related to this repository.
   * @return {Object}
   */
  get model () {
    return new Round()
  }
}
