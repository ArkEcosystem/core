const aggregate = require('../abstracts/aggregate')

module.exports = function (column, alias) {
  return [aggregate('AVG', column, alias)]
}
