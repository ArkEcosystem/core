module.exports = {
  transports: {
    console: {
      constructor: 'Console',
      options: {
        level: process.env.PHANTOM_LOG_LEVEL || 'debug',
        format: require('./formatter')(true),
        stderrLevels: ['error', 'warn'],
      },
    },
    dailyRotate: {
      package: 'winston-daily-rotate-file',
      constructor: 'DailyRotateFile',
      options: {
        level: process.env.PHANTOM_LOG_LEVEL || 'debug',
        format: require('./formatter')(false),
        filename:
          process.env.PHANTOM_LOG_FILE
          || `${process.env.PHANTOM_PATH_DATA}/logs/core/${
            process.env.PHANTOM_NETWORK_NAME
          }/%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '100m',
        maxFiles: '10',
      },
    },
  },
}
