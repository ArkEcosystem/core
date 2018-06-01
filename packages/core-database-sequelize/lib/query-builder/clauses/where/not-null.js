const isString = require('../../utils/is-string')

module.exports = function () {
  const transform = condition => ({
    column: condition,
    operator: 'IS NOT NULL'
  })

  const args = arguments[0]

  if (isString(args[0])) {
    return [transform(args[0])]
  }

  return args[0].map(argument => transform(argument))
}
