const AggregateClause = require('../abstracts/aggregate')

module.exports = class MaxClause {
  static apply (column, as) {
    return AggregateClause.apply('MAX', column, as)
  }
}
