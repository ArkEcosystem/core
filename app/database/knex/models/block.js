const { Model } = require('objection')
const pick = require('lodash/pick')

class Block extends Model {
  static get tableName () {
    return 'blocks'
  }

  static relationMappings () {
    return {
      transactions: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/Transaction`,
        join: {
          from: 'blocks.id',
          to: 'transactions.blockId'
        }
      },
      serializedTransactions: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/Transaction`,
        filter: query => query.select('serialized'),
        join: {
          from: 'blocks.id',
          to: 'transactions.blockId'
        }
      }
    }
  }

  static async findOrInsert (data) {
    let row = await this.query().where({ id: data.id, height: data.height }).first()

    if (!row) {
      const insert = await this.query().insert(pick(data, this.fillable))
      row = await this.query().where('id', insert.id).first()
    }

    return row
  }

  static async batchInsert (data) {
    return Promise.all(data.map((d) => this.findOrInsert(d)))
  }

  static get fillable () {
    return [
      'id',
      'version',
      'timestamp',
      'previousBlock',
      'height',
      'numberOfTransactions',
      'totalAmount',
      'totalFee',
      'reward',
      'payloadLength',
      'payloadHash',
      'generatorPublicKey',
      'blockSignature'
    ]
  }
}

module.exports = Block
