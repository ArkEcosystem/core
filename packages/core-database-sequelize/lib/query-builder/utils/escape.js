const isNumber = require('./is-number')
const isString = require('./is-string')

module.exports = (value, singleQuotes = false) => {
  if (value === '*') {
    return value
  }

  if (isNumber(value) || singleQuotes) {
    return `'${value}'`
  }

  if (isString(value) && value.startsWith('"') && value.endsWith('"')) {
    return value
  }

  return `"${value}"`
}
