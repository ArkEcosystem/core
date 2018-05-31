module.exports = class SelectConcern {
  static apply () {
    return Object.values(arguments[0])
  }
}
