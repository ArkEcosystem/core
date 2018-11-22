const dayjs = require('dayjs-ext')
const container = require('@arkecosystem/core-container')

/**
 * Format the given epoch based timestamp into human and unix.
 * @param  {Number} epochStamp
 * @return {Object}
 */
module.exports = epochStamp => {
  const constants = container.resolvePlugin('config').getConstants(1)
  const timestamp = dayjs(constants.epoch)
    .add(epochStamp, 'seconds')
    .utc()

  return {
    epoch: epochStamp,
    unix: timestamp.unix(),
    human: timestamp.format(),
  }
}
