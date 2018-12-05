const Repository = require('./repository')
const { Migration } = require('../models')
const { migrations: sql } = require('../queries')

module.exports = class MigrationsRepository extends Repository {
  /**
   * Find a migration by its name.
   * @param  {String} name
   * @return {Promise}
   */
  async findByName(name) {
    return this.db.oneOrNone(sql.find, { name })
  }

  /**
   * Get the model related to this repository.
   * @return {Object}
   */
  getModel() {
    return new Migration(this.pgp)
  }
}
