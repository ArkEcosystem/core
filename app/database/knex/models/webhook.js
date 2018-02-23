const { Model } = require('objection')

module.exports = class Webhook extends Model {
  static get tableName () {
    return 'webhooks'
  }

  $beforeInsert () {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate () {
    this.updated_at = new Date().toISOString();
  }
}
