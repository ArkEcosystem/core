const isString = require('../../utils/is-string')
const map = require('./utils/map')

module.exports = function () {
  const transform = condition => {
    if (condition.length === 2) {
      condition[2] = condition[1]
      condition[1] = '='
    }

    return map(condition[0], condition[1], condition[2])
  }

  const args = arguments[0]

  if (isString(args[0])) {
    return [transform(args)]
  }

  return Object
    .entries(args[0])
    .map(argument => transform(argument))
}
