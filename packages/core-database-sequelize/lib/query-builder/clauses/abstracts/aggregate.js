const escape = require('../../utils/escape')

module.exports = class AggregateClause {
  static apply (method, column, as) {
    column = Array.isArray(column)
      ? column.map(item => escape(item)).join('+')
      : escape(column)

    return as
      ? `${method} (${column}) AS "${as}"`
      : `${method} (${column}) AS "${column}"`
  }
}
