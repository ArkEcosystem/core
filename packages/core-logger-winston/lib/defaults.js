'use strict'

module.exports = {
  transports: {
    console: {
      constructor: 'Console',
      options: {
        level: process.env.ARK_LOG_LEVEL || 'debug',
        format: require('./formatter')(true)
      }
    },
    dailyRotate: {
      package: 'winston-daily-rotate-file',
      constructor: 'DailyRotateFile',
      options: {
        level: process.env.ARK_LOG_LEVEL || 'debug',
        format: require('./formatter')(false),
        filename: process.env.ARK_LOG_FILE || `${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK_NAME}/current.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '100m',
        maxFiles: '10'
      }
    }
  }
}
