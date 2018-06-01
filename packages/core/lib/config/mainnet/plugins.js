module.exports = {
  '@arkecosystem/core-event-emitter': {},
  '@arkecosystem/core-config': {},
  '@arkecosystem/core-config-json': {},
  '@arkecosystem/core-logger': {},
  '@arkecosystem/core-logger-winston': {
    transports: {
      console: {
        options: {
          colorize: true,
          level: 'debug'
        }
      },
      dailyRotate: {
        options: {
          filename: process.env.ARK_LOG_FILE || `${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK_NAME}/%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'debug',
          zippedArchive: true
        }
      }
    }
  },
  '@arkecosystem/core-database': {
    snapshots: `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`
  },
  '@arkecosystem/core-database-sequelize': {
    dialect: 'sqlite',
    storage: process.env.ARK_DB_STORAGE || `${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK_NAME}.sqlite`,
    logging: false
    // dialect: process.env.ARK_DB_DIALECT || 'postgres',
    // username: process.env.ARK_DB_USERNAME || 'node',
    // password: process.env.ARK_DB_PASSWORD || 'password',
    // database: process.env.ARK_DB_DATABASE || 'ark_mainnet'
  },
  '@arkecosystem/core-transaction-pool': {},
  '@arkecosystem/core-transaction-pool-redis': {
    enabled: true,
    key: 'ark',
    maxTransactionsPerSender: 100,
    whitelist: ['127.0.0.1', '192.168.*'],
    redis: {
      host: process.env.ARK_REDIS_HOST || 'localhost',
      port: process.env.ARK_REDIS_PORT || 6379
    }
  },
  '@arkecosystem/core-p2p': {
    host: process.env.ARK_P2P_HOST || 'localhost',
    port: process.env.ARK_P2P_PORT || 4002
  },
  '@arkecosystem/core-blockchain': {},
  '@arkecosystem/core-api': {
    enabled: false,
    host: process.env.ARK_API_HOST || 'localhost',
    port: process.env.ARK_API_PORT || 4003,
    whitelist: ['*']
  },
  '@arkecosystem/core-webhooks': {
    enabled: false,
    database: {
      dialect: 'sqlite',
      storage: `${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK_NAME}/webhooks.sqlite`,
      logging: false
    },
    redis: {
      host: process.env.ARK_REDIS_HOST || 'localhost',
      port: process.env.ARK_REDIS_PORT || 6379
    }
  },
  '@arkecosystem/core-webhooks-api': {
    enabled: false,
    port: process.env.ARK_WEBHOOKS_PORT || 4004,
    whitelist: ['127.0.0.1', '192.168.*']
  },
  '@arkecosystem/core-graphql': {},
  '@arkecosystem/core-graphql-api': {
    enabled: false,
    port: process.env.ARK_GRAPHQL_PORT || 4005,
    path: '/graphql',
    graphiql: true,
    pretty: true
  },
  '@arkecosystem/core-forger': {
    host: 'http://127.0.0.1'
  },
  '@arkecosystem/core-json-rpc': {
    enabled: false,
    port: process.env.ARK_JSONRPC_PORT || 8080,
    allowRemote: true,
    whitelist: ['127.0.0.1', '192.168.*']
  }
}
