const Model = require('./model')

module.exports = class Round extends Model {
  static get tableName () {
    return 'rounds'
  }

  static get fillable () {
    return [
      'publicKey',
      'balance',
      'round'
    ]
  }

  static relationMappings () {
    return {
      wallet: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Wallet`,
        join: {
          from: 'rounds.publicKey',
          to: 'wallets.publicKey'
        }
      },
    }
  }

  static async findOrInsert (data) {
    let row = await this.query().where({
      round: data.round,
      publicKey: data.publicKey
    }).first()

    if (!row) await this.query().insert(this.transform(data))
  }
}
