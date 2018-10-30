module.exports = {
  '@arkecosystem/core-event-emitter': {},
  '@arkecosystem/core-config': {},
  '@arkecosystem/core-logger-winston': {
    transports: {
      console: {
        options: {
          level: process.env.ARK_LOG_LEVEL || 'debug'
        }
      },
      dailyRotate: {
        options: {
          level: process.env.ARK_LOG_LEVEL || 'debug',
          filename: process.env.ARK_LOG_FILE || `${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK_NAME}/%DATE%.log`
        }
      }
    }
  },
  '@arkecosystem/core-database-postgres': {
    connection: {
      host: process.env.ARK_DB_HOST || 'localhost',
      port: process.env.ARK_DB_PORT || 5432,
      database: process.env.ARK_DB_DATABASE || `ark_${process.env.ARK_NETWORK_NAME}`,
      user: process.env.ARK_DB_USERNAME || 'ark',
      password: process.env.ARK_DB_PASSWORD || 'password'
    }
  },
  '@arkecosystem/core-transaction-pool-mem': {
    enabled: !process.env.ARK_TRANSACTION_POOL_DISABLED,
    storage: `${process.env.ARK_PATH_DATA}/database/transaction-pool-${process.env.ARK_NETWORK_NAME}.sqlite`,
    maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 300,
    whitelist: [],
    allowedSenders: [],
    maxTransactionsPerRequest: 200,
    maxTransactionAge: 21600
  },
  '@arkecosystem/core-p2p': {
    host: process.env.ARK_P2P_HOST || '0.0.0.0',
    port: process.env.ARK_P2P_PORT || 4001,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '192.168.*']
  },
  '@arkecosystem/core-blockchain': {
    fastRebuild: false
  },
  '@arkecosystem/core-api': {
    enabled: false,
    host: process.env.ARK_API_HOST || '0.0.0.0',
    port: process.env.ARK_API_PORT || 4003,
    whitelist: ['*']
  },
  '@arkecosystem/core-webhooks': {
    enabled: process.env.ARK_WEBHOOKS_ENABLED,
    database: {
      dialect: 'sqlite',
      storage: `${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK_NAME}/webhooks.sqlite`,
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
    port: process.env.ARK_GRAPHQL_PORT || 4005,
    path: '/graphql',
    graphiql: true
  },
  '@arkecosystem/core-forger': {
    hosts: [`http://127.0.0.1:${process.env.ARK_P2P_PORT || 4001}`]
  },
  '@arkecosystem/core-json-rpc': {
    enabled: process.env.ARK_JSON_RPC_ENABLED,
    host: process.env.ARK_JSON_RPC_HOST || '0.0.0.0',
    port: process.env.ARK_JSON_RPC_PORT || 8080,
    allowRemote: false,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1'],
    database: {
      uri: process.env.ARK_JSON_RPC_DATABASE || `sqlite://${process.env.ARK_PATH_DATA}/database/json-rpc.sqlite`,
      options: {}
    }
  },
  '@arkecosystem/core-snapshots': {}
}
