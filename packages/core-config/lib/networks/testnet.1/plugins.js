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
          filename: expandHomeDir(`${process.env.ARK_PATH_DATA}/logs/core/testnet.1/`) + '%DATE%.log',
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
      snapshots: `${process.env.ARK_PATH_DATA}/testnet.1/snapshots`
    },
    '@arkecosystem/core-database-sequelize': {
      uri: `sqlite:${process.env.ARK_PATH_DATA}/database/testnet.1.sqlite`,
      dialect: 'sqlite'
        // uri: 'postgres://node:password@localhost:5432/ark_testnet',
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
        port: 6379
      }
    },
    '@arkecosystem/core-p2p': {
      port: 4101,
      remoteinterface: true
    }
  },
  mounted: {
    '@arkecosystem/core-api': {
      enabled: true,
      port: 4102
    },
    '@arkecosystem/core-webhooks': {},
    '@arkecosystem/core-webhooks-api': {
      enabled: true,
      port: 4103
    },
    '@arkecosystem/core-graphql': {},
    '@arkecosystem/core-graphql-api': {
      port: 4105
    },
    '@arkecosystem/core-forger': {}
  }
}
