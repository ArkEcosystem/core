const { Model } = require('objection')

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
}

module.exports = Transaction
