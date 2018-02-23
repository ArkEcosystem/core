const { Model } = require('objection')
const pick = require('lodash/pick')

module.exports = class Wallet extends Model {
  static get tableName () {
    return 'wallets'
  }

  static relationMappings () {
    return {
      blocks: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/Block`,
        join: {
          from: 'wallets.publicKey',
          to: 'blocks.generatorPublicKey'
        }
      }
    }
  }

  static async findOrInsert (data) {
    let row = await this.query().where('address', data.address).first()

    if (!row) {
      const insert = await this.query().insert(pick(data, this.fillable))
      row = await this.query().where('id', insert.id).first()
    }

    return row
  }

  static get fillable () {
    return [
      'address',
      'publicKey',
      'secondPublicKey',
      'vote',
      'username',
      'balance',
      'votebalance',
      'producedBlocks',
      'missedBlocks'
    ]
  }

  $beforeInsert () {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate () {
    this.updated_at = new Date().toISOString();
  }
}
