const { Model } = require('objection')
const pick = require('lodash/pick')

const logger = require('app/core/logger')

module.exports = class Round extends Model {
  static get tableName () {
    return 'rounds'
  }

  static async findOrInsert (data) {
    let row = await this.query().where({
      round: data.round,
      publicKey: data.publicKey
    }).first()

    if (!row) {
      const insert = await this.query().insert(pick(data, this.fillable))
      row = await this.query().where('id', insert.id).first()
    }

    return row
  }

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

  static get fillable () {
    return [
      'publicKey',
      'balance',
      'round'
    ]
  }
}
