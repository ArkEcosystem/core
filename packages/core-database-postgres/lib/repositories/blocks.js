const Repository = require('./repository')
const { Block } = require('../models')
const { blocks: sql } = require('../queries')

module.exports = class BlocksRepository extends Repository {
  /**
   * Find a block by its ID.
   * @param  {Number} id
   * @return {Promise}
   */
  async findById (id) {
    return this.db.one(sql.findById, { id })
  }

  /**
   * Count the number of records in the database.
   * @return {Promise}
   */
  async count () {
    return this.db.one(sql.count)
  }

  /**
   * Get all of the common blocks from the database.
   * @param  {Array} ids
   * @return {Promise}
   */
  async common (ids) {
    return this.db.manyOrNone(sql.common, { ids })
  }

  /**
   * Get all of the blocks within the given height range.
   * @param  {Number} start
   * @param  {Number} end
   * @return {Promise}
   */
  async headers (start, end) {
    return this.db.many(sql.headers, { start, end })
  }

  /**
   * Get all of the blocks within the given height range and order them by height.
   * @param  {Number} start
   * @param  {Number} end
   * @return {Promise}
   */
  async heightRange (start, end) {
    return this.db.manyOrNone(sql.heightRange, { start, end })
  }

  /**
   * Get the last created block from the database.
   * @return {Promise}
   */
  async latest () {
    return this.db.oneOrNone(sql.latest)
  }

  /**
   * Get the 10 most recently created blocks from the database.
   * @return {Promise}
   */
  async recent () {
    return this.db.many(sql.recent)
  }

  /**
   * Get statistics about all blocks from the database.
   * @return {Promise}
   */
  async statistics () {
    return this.db.one(sql.statistics)
  }

  /**
   * Get top count blocks
   * @return {Promise}
   */
  async top (count) {
    return this.db.many(sql.top, { top: count })
  }

  /**
   * Delete the block from the database.
   * @param  {Number} id
   * @return {Promise}
   */
  async delete (id) {
    return this.db.none(sql.delete, { id })
  }

  /**
   * Get the model related to this repository.
   * @return {Object}
   */
  getModel () {
    return new Block(this.pgp)
  }
}
