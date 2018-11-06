'use strict'

const moment = require('moment')
const container = require('@arkecosystem/core-container')

/**
 * Format the given epoch based timestamp into human and unix.
 * @param  {Number} epochStamp
 * @return {Object}
 */
module.exports = epochStamp => {
  const constants = container.resolvePlugin('config').getConstants(1)
  const timestamp = moment(constants.epoch).utc().add(epochStamp, 'seconds')

  return {
    epoch: epochStamp,
    unix: timestamp.unix(),
    human: timestamp.format()
  }
}
