module.exports = class SumConcern {
  static apply (column, as) {
    return as
      ? `SUM ("${column}") AS "${as}"`
      : `SUM ("${column}") AS "${column}"`
  }
}
