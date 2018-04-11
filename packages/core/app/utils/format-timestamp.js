const moment = require('moment')
const config = require('../core/config')

module.exports = (epochStamp) => {
  return moment(config.getConstants(1).epoch).utc().add(epochStamp, 'seconds')
}
