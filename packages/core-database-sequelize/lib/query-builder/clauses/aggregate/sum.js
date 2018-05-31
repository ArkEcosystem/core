const AggregateClause = require('../abstracts/aggregate')

module.exports = class SumClause {
  static apply (column, as) {
    return AggregateClause.apply('SUM', column, as)
  }
}
