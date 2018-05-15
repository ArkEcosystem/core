const expandHomeDir = require('expand-home-dir')
const formatter = require('@arkecosystem/core-logger-winston').formatter

module.exports = {
  init: {
    '@arkecosystem/core-event-emitter': {},
    '@arkecosystem/core-config': {},
    '@arkecosystem/core-config-json': {}
  },
  beforeCreate: {
    '@arkecosystem/core-logger': {},
    '@arkecosystem/core-logger-winston': {
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
    },
    '@arkecosystem/core-blockchain': {}
  },
  beforeMount: {
    '@arkecosystem/core-database': {
      snapshots: `${process.env.ARK_PATH_DATA}/${process.env.ARK_NETWORK}/snapshots`
    },
    '@arkecosystem/core-database-sequelize': {
      uri: `sqlite:${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK}.sqlite`,
      dialect: 'sqlite'
      // uri: `postgres://node:password@localhost:${process.env.DB_PORT || 5432}/ark_devnet`,
      // dialect: 'postgres'
    },
    '@arkecosystem/core-transaction-pool': {},
    '@arkecosystem/core-transaction-pool-redis': {
      enabled: true,
      key: 'ark/pool',
      maxTransactionsPerSender: 100,
      whiteList: [],
      redis: {
        host: 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    },
    '@arkecosystem/core-p2p': {
      port: process.env.P2P_PORT || 4002,
      remoteinterface: true
    }
  },
  mounted: {
    '@arkecosystem/core-api': {
      enabled: true,
      port: process.env.API_PORT || 4003
    },
    '@arkecosystem/core-webhooks': {},
    '@arkecosystem/core-webhooks-api': {
      enabled: true,
      port: process.env.WEBHOOKS_PORT || 4004
    },
    '@arkecosystem/core-graphql': {},
    '@arkecosystem/core-graphql-api': {},
    '@arkecosystem/core-forger': {}
  }
}
