const Model = require('./model')
const pick = require('lodash/pick')

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

  static async findOrInsert (data) {
    let row = await this.query().where({
      round: data.round,
      publicKey: data.publicKey
    }).first()

    if (!row) await this.query().insert(this.transform(data))
  }
}
