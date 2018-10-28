'use strict'

module.exports = {
  createServer: require('./server/create'),
  monitorServer: require('./server/monitor'),
  mountServer: require('./server/mount'),
  plugins: {
    whitelist: require('./plugins/whitelist')
  }
}
