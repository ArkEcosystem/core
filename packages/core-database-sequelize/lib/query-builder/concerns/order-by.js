const isObject = require('../utils/is-object')

module.exports = class OrderByConcern {
  static apply () {
    const args = arguments[0]

    const transform = (condition) => {
      return {
        column: condition[0],
        direction: condition[1]
      }
    }

    return isObject(args[0])
      ? [args[0].map(arg => transform(arg))]
      : [transform(args)]
  }
}
