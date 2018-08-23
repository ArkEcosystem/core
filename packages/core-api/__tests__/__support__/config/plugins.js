module.exports = {
  '@phantomcore/core-event-emitter': {},
  '@phantomcore/core-config': {},
  '@phantomcore/core-logger': {},
  '@phantomcore/core-logger-winston': {},
  '@phantomcore/core-database': {},
  '@phantomcore/core-database-sequelize': {
    dialect: 'sqlite',
    storage: ':memory:'
  },
  '@phantomcore/core-transaction-pool': {},
  '@phantomcore/core-transaction-pool-redis': {},
  '@phantomcore/core-p2p': {},
  '@phantomcore/core-blockchain': {},
  '@phantomcore/core-api': {
    enabled: true,
    whitelist: [
      '127.0.0.1',
      '::ffff:127.0.0.1'
    ]
  },
  '@phantomcore/core-webhooks': {},
  '@phantomcore/core-forger': {}
}
