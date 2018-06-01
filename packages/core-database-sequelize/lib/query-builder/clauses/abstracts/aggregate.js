const escape = require('../../utils/escape')

module.exports = (method, column, alias) => {
  column = Array.isArray(column)
    ? column.map(item => escape(item)).join('+')
    : escape(column)

  return alias
    ? `${method} (${column}) AS ${escape(alias)}`
    : `${method} (${column}) AS ${column}`
}
