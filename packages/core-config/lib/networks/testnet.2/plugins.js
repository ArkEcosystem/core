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
          filename: expandHomeDir(`${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK}.2/`) + '%DATE%.log',
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
      snapshots: `${process.env.ARK_PATH_DATA}/${process.env.ARK_NETWORK}.2/snapshots`
    },
    '@arkecosystem/core-database-sequelize': {
      uri: `sqlite:${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK}.2.sqlite`,
      dialect: 'sqlite'
        // uri: `postgres://node:password@localhost:${process.env.DB_PORT || 5432}/ark_testnet`,
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
      port: process.env.P2P_PORT || 4201,
      remoteinterface: true
    }
  },
  mounted: {
    '@arkecosystem/core-api': {
      enabled: true,
      port: process.env.API_PORT || 4202
    },
    '@arkecosystem/core-webhooks': {},
    '@arkecosystem/core-webhooks-api': {
      enabled: true,
      port: process.env.WEBHOOKS_PORT || 4203
    },
    '@arkecosystem/core-graphql': {},
    '@arkecosystem/core-graphql-api': {
      port: process.env.GRAPHQL_PORT || 4205
    },
    '@arkecosystem/core-forger': {}
  }
}
