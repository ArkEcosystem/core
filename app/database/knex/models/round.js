const { Model } = require('objection')
const pick = require('lodash/pick')

class Round extends Model {
  static get tableName () {
    return 'rounds'
  }

  static async findOrInsert (data) {
    let row = await this.query().where('round', data.round).first()

    if (!row) {
      const insert = await this.query().insert(this.fillable(data))
      row = await this.query().where('id', insert.id).first()
    }

    return row
  }

  static async batchInsert (data) {
    return Promise.all(data.map((d) => this.findOrInsert(d)))
  }

  static fillable (data) {
    return pick(data, [
      'publicKey',
      'balance',
      'round'
    ])
  }
}

module.exports = Round
