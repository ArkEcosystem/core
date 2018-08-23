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
  '@phantomcore/core-api': { },
  '@phantomcore/core-webhooks': {},
  '@phantomcore/core-graphql': {},
  '@phantomcore/core-forger': {}
}
