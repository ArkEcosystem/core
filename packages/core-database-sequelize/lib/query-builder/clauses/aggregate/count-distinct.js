module.exports = class CountDistinctClause {
  static apply (column, as) {
    return as
      ? `COUNT (DISTINCT "${column}") AS "${as}"`
      : `COUNT (DISTINCT "${column}") AS "${column}"`
  }
}
