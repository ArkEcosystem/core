const Model = require('./model')

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
      },
      sender: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Wallet`,
        join: {
          from: 'transactions.senderPublicKey',
          to: 'wallets.publicKey'
        }
      },
      recipient: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Wallet`,
        join: {
          from: 'transactions.recipientId',
          to: 'wallets.address'
        }
      }
    }
  }

  static async findOrInsert (data) {
    let row = await this.query().findById(data.id)

    if (!row) await this.query().insert(this.transform(data))
  }
}
