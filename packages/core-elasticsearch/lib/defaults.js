'use strict'

module.exports = {
  server: {
    host: '0.0.0.0',
    port: 4007,
    whitelist: ['*']
  },
  client: {
    host: 'localhost:9200',
    log: 'info'
  },
  chunkSize: 50000
}
