'use strict';

const moment = require('moment')
const config = require('@arkecosystem/core-plugin-manager').get('config')

/**
 * [description]
 * @param  {[type]} epochStamp [description]
 * @return {[type]}            [description]
 */
module.exports = (epochStamp) => {
  const timestamp = moment(config.getConstants(1).epoch).utc().add(epochStamp, 'seconds')

  return {
    epoch: epochStamp,
    unix: timestamp.unix(),
    human: timestamp.format()
  }
}
