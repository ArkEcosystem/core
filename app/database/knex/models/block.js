const { Model } = require('objection')

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
      }
    }
  }
}

module.exports = Block
