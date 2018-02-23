const Model = require('./model')
const pick = require('lodash/pick')

module.exports = class Transaction extends Model {
  static get tableName () {
    return 'transactions'
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

    if (!row) await this.query().insert(pick(data, this.fillable))
  }
}
