const { Model } = require('objection')
const pick = require('lodash/pick')

class Transaction extends Model {
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
      }
    }
  }

  static async findOrInsert (data) {
    let row = await this.query().findById(data.id)

    if (!row) {
      const insert = await this.query().insert(this.fillable(data))
      row = await this.query().where('id', insert.id).first()
    }

    return row
  }

  static async batchInsert (data) {
    return Promise.all(data.map((d) => this.findOrInsert(d)))
  }

  static fillable (data) {
    return pick(data, [
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
    ])
  }
}

module.exports = Transaction
