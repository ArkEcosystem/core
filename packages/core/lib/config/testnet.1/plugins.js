module.exports = {
  '@arkecosystem/core-event-emitter': {},
  '@arkecosystem/core-config': {},
  '@arkecosystem/core-config-json': {},
  '@arkecosystem/core-logger': {},
  '@arkecosystem/core-logger-winston': {
    transports: {
      dailyRotate: {
        options: {
          filename: `${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK_NAME}.1/%DATE%.log`
        }
      }
    }
  },
  '@arkecosystem/core-database': {
    snapshots: `${process.env.ARK_PATH_DATA}/${process.env.ARK_NETWORK_NAME}.1/snapshots`
  },
  '@arkecosystem/core-database-sequelize': {
    dialect: 'sqlite',
    storage: `${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK_NAME}.1.sqlite`
    // dialect: 'postgres',
    // username: 'node',
    // password: 'password',
    // database: 'ark_testnet'
  },
  '@arkecosystem/core-transaction-pool': {},
  '@arkecosystem/core-transaction-pool-redis': {
    key: 'ark1'
  },
  '@arkecosystem/core-p2p': {
    port: 4101
  },
  '@arkecosystem/core-blockchain': {},
  '@arkecosystem/core-api': {
    port: 4102
  },
  '@arkecosystem/core-webhooks': {},
  '@arkecosystem/core-webhooks-api': {
    port: 4103
  },
  '@arkecosystem/core-graphql': {},
  '@arkecosystem/core-graphql-api': {
    port: 4105
  },
  '@arkecosystem/core-forger': {},
  '@arkecosystem/core-json-rpc': {
    enabled: false
  }
}
