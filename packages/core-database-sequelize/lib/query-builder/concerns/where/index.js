const isObject = require('../../utils/is-object')

module.exports = class WhereConcern {
  static apply () {
    const args = arguments[0]

    const transform = (condition) => {
      return {
        column: args[0],
        operator: args[1],
        value: args[2]
      }
    }

    return isObject(args[0])
      ? args[0].map(arg => transform(arg))
      : transform(args)
  }
}
