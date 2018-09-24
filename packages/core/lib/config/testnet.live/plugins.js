module.exports = {
  '@arkecosystem/core-storage': {},
  '@arkecosystem/core-event-emitter': {},
  '@arkecosystem/core-config': {},
  '@arkecosystem/core-logger': {},
  '@arkecosystem/core-logger-winston': {
    transports: {
      console: {
        options: {
          colorize: true,
          level: process.env.ARK_LOG_LEVEL || 'debug'
        }
      },
      dailyRotate: {
        options: {
          filename: process.env.ARK_LOG_FILE || `${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK_NAME}.live/%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: process.env.ARK_LOG_LEVEL || 'debug',
          zippedArchive: true,
          maxSize: '100m',
          maxFiles: '10'
        }
      }
    }
  },
  '@arkecosystem/core-database': {
    snapshots: `${process.env.ARK_PATH_DATA}/${process.env.ARK_NETWORK_NAME}.live/snapshots`
  },
  '@arkecosystem/core-database-postgres': {
    connection: {
      host: process.env.ARK_DB_HOST || 'localhost',
      port: process.env.ARK_DB_PORT || 5432,
      database: process.env.ARK_DB_DATABASE || `ark_${process.env.ARK_NETWORK_NAME}live`,
      user: process.env.ARK_DB_USERNAME || 'ark',
      password: process.env.ARK_DB_PASSWORD || 'password'
    },
    redis: {
      host: process.env.ARK_REDIS_HOST || 'localhost',
      port: process.env.ARK_REDIS_PORT || 6379
    }
  },
  '@arkecosystem/core-transaction-pool': {},
  '@arkecosystem/core-transaction-pool-redis': {
    enabled: !process.env.ARK_TRANSACTION_POOL_DISABLED,
    key: 'ark1',
    maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 300,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '192.168.*'],
    allowedSenders: [],
    maxTransactionsPerRequest: 200,
    maxTransactionAge: 21600,
    redis: {
      host: process.env.ARK_REDIS_HOST || 'localhost',
      port: process.env.ARK_REDIS_PORT || 6379
    }
  },
  '@arkecosystem/core-p2p': {
    host: process.env.ARK_P2P_HOST || '0.0.0.0',
    port: process.env.ARK_P2P_PORT || 4000,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '192.168.*']
  },
  '@arkecosystem/core-blockchain': {
    fastRebuild: false
  },
  '@arkecosystem/core-api': {
    enabled: true,
    host: process.env.ARK_API_HOST || '0.0.0.0',
    port: process.env.ARK_API_PORT || 4003,
    whitelist: ['*']
  },
  '@arkecosystem/core-webhooks': {
    enabled: process.env.ARK_WEBHOOKS_ENABLED,
    database: {
      dialect: 'sqlite',
      storage: `${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK_NAME}.live/webhooks.sqlite`,
      logging: process.env.ARK_DB_LOGGING
    },
    server: {
      enabled: process.env.ARK_WEBHOOKS_API_ENABLED,
      host: process.env.ARK_WEBHOOKS_HOST || '0.0.0.0',
      port: process.env.ARK_WEBHOOKS_PORT || 4004,
      whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '192.168.*']
    }
  },
  '@arkecosystem/core-graphql': {
    enabled: process.env.ARK_GRAPHQL_ENABLED,
    host: process.env.ARK_GRAPHQL_HOST || '0.0.0.0',
    port: process.env.ARK_GRAPHQL_PORT || 4105,
    path: '/graphql',
    graphiql: true
  },
  '@arkecosystem/core-forger': {
    hosts: [`http://127.0.0.1:${process.env.ARK_P2P_PORT || 4000}`]
  },
  '@arkecosystem/core-json-rpc': {
    enabled: process.env.ARK_JSON_RPC_ENABLED,
    host: process.env.ARK_JSON_RPC_HOST || '0.0.0.0',
    port: process.env.ARK_JSON_RPC_PORT || 8080,
    allowRemote: true,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '192.168.*'],
    database: {
      uri: process.env.ARK_JSON_RPC_DATABASE || `sqlite://${process.env.ARK_PATH_DATA}/database/json-rpc.sqlite`,
      options: {}
    }
  }
}
