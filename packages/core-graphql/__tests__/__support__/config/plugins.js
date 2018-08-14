module.exports = {
  '@arkecosystem/core-config': {},
  '@arkecosystem/core-logger': {},
  '@arkecosystem/core-logger-winston': {
    transports: {
      console: {
        options: {
          colorize: true,
          level: process.env.ARK_LOG_LEVEL || 'debug'
        }
      },
      dailyRotate: {
        options: {
          filename: process.env.ARK_LOG_FILE || `${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK_NAME}/%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: process.env.ARK_LOG_LEVEL || 'debug',
          zippedArchive: true
        }
      }
    }
  },
'@arkecosystem/core-graphql': {
    enabled: true,
    host: 'localhost',
    port: 4005,
    path: '/graphql',
    graphiql: true
  }
}
