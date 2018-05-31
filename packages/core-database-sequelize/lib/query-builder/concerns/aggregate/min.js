module.exports = class MinConcern {
  static apply (column, as) {
    return as
      ? `MIN ("${column}") AS "${as}"`
      : `MIN ("${column}") AS "${column}"`
  }
}
