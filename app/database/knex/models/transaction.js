const { Model } = require('objection')
const pick = require('lodash/pick')

const logger = require('app/core/logger')

module.exports = class Transaction extends Model {
  static get tableName () {
    return 'transactions'
  }

  static relationMappings () {
    return {
      block: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Block`,
        join: {
          from: 'transactions.blockId',
          to: 'blocks.id'
        }
      },
      blockHeight: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Block`,
        filter: query => query.select('height'),
        join: {
          from: 'transactions.blockId',
          to: 'blocks.id'
        }
      }
    }
  }

  static async findOrInsert (data) {
    let row = await this.query().findById(data.id)

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
      'id',
      'version',
      'blockId',
      'timestamp',
      'senderPublicKey',
      'recipientId',
      'type',
      'vendorFieldHex',
      'amount',
      'fee',
      'serialized'
    ]
  }

  $beforeInsert () {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate () {
    this.updated_at = new Date().toISOString();
  }
}
