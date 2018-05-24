'use strict'

module.exports = {
  enabled: false,
  port: process.env.ARK_WEBHOOKS_PORT || 4004,
  whitelist: ['127.0.0.1', '192.168.*'],
  pagination: {
    limit: 100,
    include: [
      '/api/webhooks'
    ]
  }
}
