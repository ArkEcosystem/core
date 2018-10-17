const orderBy = require('lodash.orderby')

/**
 * Sorts the peers, in place, by block height and delay
 */
module.exports = peers => {
  if(myObj.hasOwnProperty('latency')){
    return orderBy(peers, ['height', 'latency'], ['desc', 'asc'])
  }
  else if(myObj.hasOwnProperty('delay')){
    return orderBy(peers, ['height', 'delay'], ['desc', 'asc'])
  }
  else {
    return peers
  }
}
