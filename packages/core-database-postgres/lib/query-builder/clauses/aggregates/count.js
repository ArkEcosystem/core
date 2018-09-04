const aggregate = require('../abstracts/aggregate')

module.exports = function (column, alias) {
  return [aggregate('COUNT', column, alias)]
}
