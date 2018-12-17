module.exports = {
  '@phantomchain/core-event-emitter': {},
  '@phantomchain/core-config': {},
  '@phantomchain/core-logger-winston': {
    transports: {
      console: {
        options: {
          level: process.env.PHANTOM_LOG_LEVEL || 'debug',
        },
      },
      dailyRotate: {
        options: {
          level: process.env.PHANTOM_LOG_LEVEL || 'debug',
        },
      },
    },
  },
  '@phantomchain/core-database-postgres': {
    connection: {
      host: process.env.PHANTOM_DB_HOST || 'localhost',
      port: process.env.PHANTOM_DB_PORT || 5432,
      database:
        process.env.PHANTOM_DB_DATABASE ||
        `phantom_${process.env.PHANTOM_NETWORK_NAME}`,
      user: process.env.PHANTOM_DB_USERNAME || 'phantom',
      password: process.env.PHANTOM_DB_PASSWORD || 'password',
    },
  },
  '@phantomchain/core-transaction-pool-mem': {
    enabled: !process.env.PHANTOM_TRANSACTION_POOL_DISABLED,
    maxTransactionsPerSender:
      process.env.PHANTOM_TRANSACTION_POOL_MAX_PER_SENDER || 300,
    allowedSenders: [],
  },
  '@phantomchain/core-p2p': {
    host: process.env.PHANTOM_P2P_HOST || '0.0.0.0',
    port: process.env.PHANTOM_P2P_PORT || 4001,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1'],
  },
  '@phantomchain/core-blockchain': {
    fastRebuild: false,
  },
  '@phantomchain/core-api': {
    enabled: !process.env.PHANTOM_API_DISABLED,
    host: process.env.PHANTOM_API_HOST || '0.0.0.0',
    port: process.env.PHANTOM_API_PORT || 4003,
    whitelist: ['*'],
  },
  '@phantomchain/core-webhooks': {
    enabled: process.env.PHANTOM_WEBHOOKS_ENABLED,
    server: {
      enabled: process.env.PHANTOM_WEBHOOKS_API_ENABLED,
      host: process.env.PHANTOM_WEBHOOKS_HOST || '0.0.0.0',
      port: process.env.PHANTOM_WEBHOOKS_PORT || 4004,
      whitelist: ['127.0.0.1', '::ffff:127.0.0.1'],
    },
  },
  '@phantomchain/core-graphql': {
    enabled: process.env.PHANTOM_GRAPHQL_ENABLED,
    host: process.env.PHANTOM_GRAPHQL_HOST || '0.0.0.0',
    port: process.env.PHANTOM_GRAPHQL_PORT || 4005,
  },
  '@phantomchain/core-forger': {
    hosts: [`http://127.0.0.1:${process.env.PHANTOM_P2P_PORT || 4001}`],
  },
  '@phantomchain/core-json-rpc': {
    enabled: process.env.PHANTOM_JSON_RPC_ENABLED,
    host: process.env.PHANTOM_JSON_RPC_HOST || '0.0.0.0',
    port: process.env.PHANTOM_JSON_RPC_PORT || 8080,
    allowRemote: false,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1'],
  },
}
