const Model = require('./model')

module.exports = class Webhook extends Model {
  static get tableName () {
    return 'webhooks'
  }

  static get fillable () {
    return [
      'event',
      'target',
      'conditions',
      'secret',
      'enabled'
    ]
  }
}
