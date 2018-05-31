const AggregateClause = require('../abstracts/aggregate')

module.exports = class CountClause {
  static apply (column, as) {
    return AggregateClause.apply('COUNT', column, as)
  }
}
