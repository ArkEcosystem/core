module.exports = class AverageConcern {
  static apply (column, as) {
    return as
      ? `AVG ("${column}") AS "${as}"`
      : `AVG ("${column}")`
  }
}
