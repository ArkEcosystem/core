const expandHomeDir = require('expand-home-dir')
const formatter = require('@arkecosystem/core-logger-winston').formatter

module.exports = {
  init: {
    '@arkecosystem/core-event-emitter': {},
    '@arkecosystem/core-config': {},
    '@arkecosystem/core-config-json': {}
  },
  beforeCreate: {
    '@arkecosystem/core-logger': {
      driver: '@arkecosystem/core-logger-winston'
    },
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
    '@arkecosystem/core-webhooks': {},
    '@arkecosystem/core-blockchain': {}
  },
  beforeMount: {
    '@arkecosystem/core-database': {
      driver: '@arkecosystem/core-database-sequelize',
      snapshots: `${process.env.ARK_PATH_DATA}/testnet.1/snapshots`
    },
    '@arkecosystem/core-database-sequelize': {
      uri: `sqlite:${process.env.ARK_PATH_DATA}/database/testnet.1.sqlite`,
      dialect: 'sqlite'
        // uri: 'postgres://node:password@localhost:5432/ark_testnet',
        // dialect: 'postgres'
    },
    '@arkecosystem/core-api-p2p': {
      port: 4101,
      remoteinterface: true
    },
    '@arkecosystem/core-transaction-pool': {
      driver: '@arkecosystem/core-transaction-pool-redis'
    },
    '@arkecosystem/core-transaction-pool-redis': {
      enabled: true,
      key: 'ark/pool',
      maxTransactionsPerSender: 5,
      whiteList: [],
      redis: {
        host: 'localhost',
        port: 6379
      }
    }
  },
  mounted: {
    '@arkecosystem/core-api-public': {
      enabled: true,
      port: 4102
    },
    '@arkecosystem/core-api-webhooks': {
      enabled: true,
      port: 4103
    },
    '@arkecosystem/core-forger': {}
  }
}
