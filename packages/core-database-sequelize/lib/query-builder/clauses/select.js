module.exports = class SelectClause {
  static apply () {
    return Object.values(arguments[0])
  }
}
