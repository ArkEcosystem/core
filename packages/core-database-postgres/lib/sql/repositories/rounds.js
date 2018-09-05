const Repository = require('./repository')
const { Round } = require('../models')
const { rounds: sql } = require('../queries')

module.exports = class BlocksRepository extends Repository {
  async delete () {
    return this.db.one(sql.delete)
  }

  async findById (id) {
    return this.db.one(sql.find, [id])
  }

  get model () {
    return Round
  }
}
