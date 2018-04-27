module.exports = {
  init: {
    '@arkecosystem/core-event-emitter': {},
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
      uri: 'sqlite:~/.ark/database/testnet.1.sqlite',
      uri_1: 'postgres://node:password@localhost:5432/ark_testnet',
      dialect: 'sqlite',
      dialect_1: 'postgres'
    },
    '@arkecosystem/core-api-p2p': {
      port: 4101
    },
    '@arkecosystem/core-transaction-pool-redis': {}
  },
  mounted: {
    '@arkecosystem/core-api-public': {
      port: 4102
    },
    '@arkecosystem/core-api-webhooks': {
      port: 4103
    },
    '@arkecosystem/core-forger': {}
  }
}
