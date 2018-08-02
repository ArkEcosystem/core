'use strict'

module.exports = {
  enabled: !process.env.ARK_WEBHOOKS_DISABLED,
  database: {
    dialect: 'sqlite',
    storage: `${process.env.ARK_PATH_DATA}/database/webhooks.sqlite`,
    logging: process.env.ARK_DB_LOGGING
  },
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  },
  server: {
    enabled: process.env.ARK_WEBHOOKS_API_ENABLED,
    host: process.env.ARK_WEBHOOKS_HOST || '0.0.0.0',
    port: process.env.ARK_WEBHOOKS_PORT || 4004,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '192.168.*'],
    pagination: {
      limit: 100,
      include: [
        '/api/webhooks'
      ]
    }
  }
}
