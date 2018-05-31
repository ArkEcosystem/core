module.exports = class MaxConcern {
  static apply (column, as) {
    return as
      ? `MAX ("${column}") AS "${as}"`
      : `MAX ("${column}")`
  }
}
