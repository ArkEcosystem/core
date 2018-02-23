const { Model } = require('objection')
const pick = require('lodash/pick')

const logger = require('app/core/logger')

module.exports = class BaseModel extends Model {
  static async batchInsert (data) {
    try {
      const rows = data.map(d => pick(d, this.fillable))

      return this.knex().transaction((trx) => this.knex().batchInsert(this.tableName, rows).transacting(trx))
    } catch (error) {
      logger.error(error.stack)
      process.exit()
    }

    // return Promise.all(data.map((d) => this.findOrInsert(d)))
  }

  $beforeInsert () {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate () {
    this.updated_at = new Date().toISOString();
  }
}
