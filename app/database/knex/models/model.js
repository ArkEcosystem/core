const { Model } = require('objection')
const pick = require('lodash/pick')
const logger = require('app/core/logger')

module.exports = class BaseModel extends Model {
  static transform (data) {
    return Array.isArray(data)
      ? data.map(d => pick(d, this.fillable))
      : pick(data, this.fillable)
  }
}
