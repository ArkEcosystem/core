const Model = require('./model')

module.exports = class Block extends Model {
  static get tableName () {
    return 'blocks'
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

  static relationMappings () {
    return {
      generator: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Wallet`,
        join: {
          from: 'blocks.generatorPublicKey',
          to: 'wallets.publicKey'
        }
      },
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
}
