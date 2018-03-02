const { Model } = require('objection')
const pick = require('lodash/pick')

module.exports = class BaseModel extends Model {
  static prepare (data) {
    return Array.isArray(data)
      ? data.map(d => pick(d, this.fillable))
      : pick(data, this.fillable)
  }
}
