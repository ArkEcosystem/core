const isObject = require('../../utils/is-object')

module.exports = class WhereClause {
  static apply () {
    const args = arguments[0]

    const transform = (condition) => {
      if (condition.length === 2) {
        condition[2] = condition[1]
        condition[1] = '='
      }

      return {
        column: condition[0],
        operator: condition[1],
        value: condition[2]
      }
    }

    return isObject(args[0])
      ? args[0].map(arg => transform(arg))
      : transform(args)
  }
}
