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
      uri: `sqlite:${process.env.ARK_PATH_DATA}/database/testnet.sqlite`,
      uri_1: 'postgres://node:password@localhost:5432/ark_testnet',
      dialect: 'sqlite',
      dialect_1: 'postgres'
    },
    '@arkecosystem/core-api-p2p': {
      port: 4000
    },
    '@arkecosystem/core-transaction-pool': {},
    '@arkecosystem/core-transaction-pool-redis': {}
  },
  mounted: {
    '@arkecosystem/core-api-public': {},
    '@arkecosystem/core-api-webhooks': {},
    '@arkecosystem/core-forger': {}
  }
}
