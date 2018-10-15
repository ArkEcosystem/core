'use strict'

module.exports = {
  transports: {
    console: {
      options: {
        colorize: true,
        level: process.env.ARK_LOG_LEVEL || 'debug',
        format: require('./formatter')
      }
    },
    dailyRotate: {
      options: {
        filename: process.env.ARK_LOG_FILE || `${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK_NAME}/%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: process.env.ARK_LOG_LEVEL || 'debug',
        zippedArchive: true,
        maxSize: '100m',
        maxFiles: '10'
      }
    }
  }
}
