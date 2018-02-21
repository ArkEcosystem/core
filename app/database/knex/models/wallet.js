const { Model } = require('objection')
const pick = require('lodash/pick')

class Wallet extends Model {
  static get tableName () {
    return 'wallets'
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
}

module.exports = Wallet
