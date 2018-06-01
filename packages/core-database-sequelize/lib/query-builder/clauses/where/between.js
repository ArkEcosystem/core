const isString = require('../../utils/is-string')

module.exports = function () {
  const transform = condition => ({
    column: condition[0],
    operator: 'BETWEEN',
    from: condition[1],
    to: condition[2]
  })

  const args = arguments[0]

  if (isString(args[0])) {
    return [transform(args)]
  }

  return Object
    .values(args)
    .map(argument => transform(argument))
}
