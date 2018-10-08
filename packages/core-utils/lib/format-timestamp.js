'use strict'

const moment = require('moment')
const config = require('@arkecosystem/core-container').resolvePlugin('config')

/**
 * Format the given epoch based timestamp into human and unix.
 * @param  {Number} epochStamp
 * @return {Object}
 */
module.exports = epochStamp => {
  const timestamp = moment(config.getConstants(1).epoch).utc().add(epochStamp, 'seconds')

  return {
    epoch: epochStamp,
    unix: timestamp.unix(),
    human: timestamp.format()
  }
}
