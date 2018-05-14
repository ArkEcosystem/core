'use strict'

const expandHomeDir = require('expand-home-dir')
const formatter = require('./formatter')

module.exports = {
  transports: [{
    constructor: 'Console',
    options: {
      colorize: true,
      level: 'debug',
      timestamp: () => Date.now(),
      formatter: (info) => formatter(info)
    }
  }, {
    package: 'winston-daily-rotate-file',
    constructor: 'DailyRotateFile',
    options: {
      filename: expandHomeDir(`${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK}/`) + '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      zippedArchive: true
    }
  }]
}
