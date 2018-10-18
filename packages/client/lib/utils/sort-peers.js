const orderBy = require('lodash.orderby')

/**
 * Sorts the peers, in place, by block height and delay
 */
module.exports = peers => orderBy(peers, [
  'height', peers[0].latency ? 'latency' : 'delay'
], ['desc', 'asc'])
