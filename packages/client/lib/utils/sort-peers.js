const orderBy = require('lodash.orderby')

/**
 * Sorts the peers, in place, by block height and delay
 */
const sortPeers = peers => {
  return orderBy(peers, ['height', 'delay'], ['desc', 'asc'])
}

module.exports = sortPeers
