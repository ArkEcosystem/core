const { Model } = require('objection')

class Wallet extends Model {
  static get tableName () {
    return 'wallets'
  }
}

module.exports = Wallet
