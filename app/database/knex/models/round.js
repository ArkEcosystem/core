const { Model } = require('objection')
const pick = require('lodash/pick')

class Round extends Model {
  static get tableName () {
    return 'rounds'
  }

  static async findOrInsert (data) {
    let row = await this.query().where('round', data.round).first()

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
      'publicKey',
      'balance',
      'round'
    ]
  }
}

module.exports = Round
