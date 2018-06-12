module.exports = {
  '@arkecosystem/core-event-emitter': {},
  '@arkecosystem/core-config': {},
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
          filename: process.env.ARK_LOG_FILE || `${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK_NAME}.2/%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'debug',
          zippedArchive: true
        }
      }
    }
  },
  '@arkecosystem/core-database': {
    snapshots: `${process.env.ARK_PATH_DATA}/${process.env.ARK_NETWORK_NAME}.2/snapshots`
  },
  '@arkecosystem/core-database-sequelize': {
    dialect: 'sqlite',
    storage: process.env.ARK_DB_STORAGE || `${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK_NAME}.2.sqlite`,
    // host: process.env.ARK_DB_HOST || 'localhost',
    // dialect: process.env.ARK_DB_DIALECT || 'postgres',
    // username: process.env.ARK_DB_USERNAME || 'ark',
    // password: process.env.ARK_DB_PASSWORD || 'password',
    // database: process.env.ARK_DB_DATABASE || 'ark_testnet2',
    logging: false,
    redis: {
      host: process.env.ARK_REDIS_HOST || 'localhost',
      port: process.env.ARK_REDIS_PORT || 6379
    }
  },
  '@arkecosystem/core-transaction-pool': {},
  '@arkecosystem/core-transaction-pool-redis': {
    enabled: true,
    key: 'ark2',
    maxTransactionsPerSender: 100,
    whitelist: ['03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357'],
    redis: {
      host: process.env.ARK_REDIS_HOST || 'localhost',
      port: process.env.ARK_REDIS_PORT || 6379
    }
  },
  '@arkecosystem/core-p2p': {
    host: process.env.ARK_P2P_HOST || '0.0.0.0',
    port: process.env.ARK_P2P_PORT || 4202
  },
  '@arkecosystem/core-blockchain': {},
  '@arkecosystem/core-api': {
    enabled: true,
    host: process.env.ARK_API_HOST || '0.0.0.0',
    port: process.env.ARK_API_PORT || 4203,
    whitelist: ['*']
  },
  '@arkecosystem/core-webhooks': {
    enabled: false,
    database: {
      dialect: 'sqlite',
      storage: `${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK_NAME}.2/webhooks.sqlite`,
      logging: false
    },
    redis: {
      host: process.env.ARK_REDIS_HOST || 'localhost',
      port: process.env.ARK_REDIS_PORT || 6379
    },
    server: {
      enabled: false,
      host: process.env.ARK_WEBHOOKS_HOST || '0.0.0.0',
      port: process.env.ARK_WEBHOOKS_PORT || 4004,
      whitelist: ['127.0.0.1', '192.168.*']
    }
  },
  '@arkecosystem/core-graphql': {
    enabled: false,
    host: process.env.ARK_GRAPHQL_HOST || '0.0.0.0',
    port: process.env.ARK_GRAPHQL_PORT || 4205,
    path: '/graphql',
    graphiql: true
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
