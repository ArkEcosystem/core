module.exports = {
  createServer: require('./server/create'),
  createSecureServer: require('./server/create-secure'),
  monitorServer: require('./server/monitor'),
  mountServer: require('./server/mount'),
  plugins: {
    contentType: require('./plugins/content-type'),
    corsHeaders: require('./plugins/cors-headers'),
    transactionPayload: require('./plugins/transaction-payload'),
    whitelist: require('./plugins/whitelist'),
  },
}
