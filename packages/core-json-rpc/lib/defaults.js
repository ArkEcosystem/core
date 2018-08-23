module.exports = {
  enabled: process.env.PHANTOM_JSON_RPC_ENABLED,
  host: process.env.PHANTOM_JSON_RPC_HOST || '0.0.0.0',
  port: process.env.PHANTOM_JSON_RPC_PORT || 8080,
  allowRemote: false,
  whitelist: ['127.0.0.1', '::ffff:127.0.0.1'],
  database: {
    uri:
      process.env.PHANTOM_JSON_RPC_DATABASE
      || `sqlite://${process.env.PHANTOM_PATH_DATA}/database/json-rpc.sqlite`,
    options: {},
  },
}
