const aggregate = require('../abstracts/aggregate')

module.exports = function (column, alias) {
  return [aggregate('MIN', column, alias)]
}
