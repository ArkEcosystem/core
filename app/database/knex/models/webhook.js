const { Model } = require('objection')

class Webhook extends Model {
  static get tableName () {
    return 'webhooks'
  }
}

module.exports = Webhook
