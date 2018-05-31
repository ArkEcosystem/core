const AggregateClause = require('../abstracts/aggregate')

module.exports = class AvgClause {
  static apply (column, as) {
    return AggregateClause.apply('AVG', column, as)
  }
}
