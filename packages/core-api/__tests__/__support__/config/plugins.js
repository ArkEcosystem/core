module.exports = {
  '@arkecosystem/core-storage': {},
  '@arkecosystem/core-event-emitter': {},
  '@arkecosystem/core-config': {},
  '@arkecosystem/core-logger': {},
  '@arkecosystem/core-logger-winston': {},
  '@arkecosystem/core-database': {},
  '@arkecosystem/core-database-sequelize': {
    dialect: 'sqlite',
    storage: ':memory:'
  },
  '@arkecosystem/core-transaction-pool': {},
  '@arkecosystem/core-transaction-pool-redis': {},
  '@arkecosystem/core-p2p': {},
  '@arkecosystem/core-blockchain': {},
  '@arkecosystem/core-api': {
    enabled: true,
    whitelist: [
      '127.0.0.1',
      '::ffff:127.0.0.1'
    ]
  },
  '@arkecosystem/core-webhooks': {},
  '@arkecosystem/core-forger': {}
}
