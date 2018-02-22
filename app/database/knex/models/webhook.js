const { Model } = require('objection')

module.exports = class Webhook extends Model {
  static get tableName () {
    return 'webhooks'
  }
}
