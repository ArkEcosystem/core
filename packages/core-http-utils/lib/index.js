module.exports = {
  createServer: require('./server/create'),
  createSecureServer: require('./server/create-secure'),
  monitorServer: require('./server/monitor'),
  mountServer: require('./server/mount'),
  plugins: {
    corsHeaders: require('./plugins/cors-headers'),
    transactionPayload: require('./plugins/transaction-payload'),
    whitelist: require('./plugins/whitelist'),
  },
}
