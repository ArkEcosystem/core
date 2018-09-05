const Repository = require('./repository')
const { Block } = require('../models')
const { blocks: sql } = require('../queries')

module.exports = class BlocksRepository extends Repository {
  async findById (id) {
    return this.db.one(sql.findById, [id])
  }

  async count () {
    return this.db.one(sql.count)
  }

  async common (ids) {
    return this.db.one(sql.common, [ids.join(',')])
  }

  async headers (start, end) {
    return this.db.many(sql.headers, [start, end])
  }

  async heightRange (start, end) {
    return this.db.many(sql.heightRange, [start, end])
  }

  async latest () {
    return this.db.oneOrNone(sql.latest)
  }

  async recent () {
    return this.db.many(sql.recent)
  }

  async statistics () {
    return this.db.one(sql.statistics)
  }

  async delete (id) {
    return this.db.none(sql.transactions.delete, [id])
  }

  get model () {
    return Block
  }
}
