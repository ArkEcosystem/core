const isString = require('../utils/is-string')

module.exports = function () {
  const transform = condition => ({
    column: condition[0],
    direction: condition[1]
  })

  const args = arguments[0]

  if (isString(args[0])) {
    return [transform(args)]
  }

  return Object
    .entries(args[0])
    .map(argument => transform(argument))
}
