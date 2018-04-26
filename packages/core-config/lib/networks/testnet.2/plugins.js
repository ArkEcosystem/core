module.exports = {
  init: {
    '@arkecosystem/core-config': {},
    '@arkecosystem/core-config-json': {}
  },
  beforeCreate: {
    '@arkecosystem/core-logger': {},
    '@arkecosystem/core-logger-winston': {},
    '@arkecosystem/core-webhooks': {},
    '@arkecosystem/core-blockchain': {}
  },
  beforeMount: {
    '@arkecosystem/core-database': {},
    '@arkecosystem/core-database-sequelize': {
      uri: 'sqlite:~/.ark/database/testnet.2.sqlite',
      uri_1: 'postgres://node:password@localhost:5432/ark_testnet',
      dialect: 'sqlite',
      dialect_1: 'postgres'
    },
    '@arkecosystem/core-api-p2p': {
      port: 4201
    },
    '@arkecosystem/core-transaction-pool-redis': {}
  },
  mounted: {
    '@arkecosystem/core-api-public': {
      port: 4202
    },
    '@arkecosystem/core-api-webhooks': {
      port: 4203
    },
    '@arkecosystem/core-forger': {}
  }
}
