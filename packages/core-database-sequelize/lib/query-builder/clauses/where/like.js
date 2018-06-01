const isString = require('../../utils/is-string')
const map = require('./utils/map')

module.exports = function () {
  const transform = condition => map(condition[0], 'LIKE', `%${condition[1]}%`)

  const args = arguments[0]

  if (isString(args[0])) {
    return [transform(args)]
  }

  return Object
    .entries(args[0])
    .map(argument => transform(argument))
}
