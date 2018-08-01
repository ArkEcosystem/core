const orderBy = require('lodash.orderby')

/**
 * Sorts the peers, in place, by block height and delay
 */
module.exports = peers => {
  return orderBy(peers, ['height', 'delay'], ['desc', 'asc'])
}
