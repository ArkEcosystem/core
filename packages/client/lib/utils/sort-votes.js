const sortBy = require('lodash/sortBy')

module.exports = (votes) => {
  return sortBy(votes, [vote => {
    return vote.startsWith('+')
  }])
}
