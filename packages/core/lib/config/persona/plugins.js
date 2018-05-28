module.exports = {
  '@arkecosystem/core-event-emitter': {},
  '@arkecosystem/core-config': {},
  '@arkecosystem/core-config-json': {},
  '@arkecosystem/core-logger': {},
  '@arkecosystem/core-logger-winston': {},
  '@arkecosystem/core-database': {},
  '@arkecosystem/core-database-sequelize': {
    // dialect: 'postgres',
    // username: '',
    // password: '',
    // database: 'persona_mainnet'
    dialect: 'sqlite',
    storage: `${process.env.ARK_PATH_DATA}/database/persona.sqlite`
  },
  '@arkecosystem/core-transaction-pool': {},
  '@arkecosystem/core-transaction-pool-redis': {
    enabled: false
  },
  '@arkecosystem/core-p2p': {
    port: 4102
  },
  '@arkecosystem/core-blockchain': {},
  '@arkecosystem/core-api': {
    port: 4103
  },
  '@arkecosystem/core-webhooks': {},
  '@arkecosystem/core-webhooks-api': {
    port: 4104
  },
  '@arkecosystem/core-graphql': {},
  '@arkecosystem/core-graphql-api': {},
  '@arkecosystem/core-forger': {},
  '@arkecosystem/core-json-rpc': {
    enabled: false
  }
}
