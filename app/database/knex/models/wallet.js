const Model = require('./model')

module.exports = class Wallet extends Model {
  static get tableName () {
    return 'wallets'
  }

  static relationMappings () {
    return {
      blocks: {
        relation: sModel.HasManyRelation,
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

    if (!row) await this.query().insert(this.transform(data))
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
}
