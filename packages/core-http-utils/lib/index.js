'use strict'

module.exports = {
  createServer: require('./server/create'),
  monitorServer: require('./server/monitor'),
  mountServer: require('./server/mount'),
  plugins: {
    corsHeaders: require('./plugins/cors-headers'),
    whitelist: require('./plugins/whitelist'),
  }
}
