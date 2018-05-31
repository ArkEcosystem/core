const AggregateClause = require('../abstracts/aggregate')

module.exports = class MinClause {
  static apply (column, as) {
    return AggregateClause.apply('MIN', column, as)
  }
}
