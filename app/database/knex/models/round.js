const { Model } = require('objection')

class Round extends Model {
  static get tableName () {
    return 'rounds'
  }
}

module.exports = Round
