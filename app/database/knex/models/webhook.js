const Model = require('./model')

module.exports = class Webhook extends Model {
  static get tableName () {
    return 'webhooks'
  }
}
