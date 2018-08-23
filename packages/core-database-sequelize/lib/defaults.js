'use strict'

module.exports = {
  dialect: 'sqlite',
  storage: process.env.PHANTOM_DB_STORAGE || `${process.env.PHANTOM_PATH_DATA}/database/${process.env.PHANTOM_NETWORK_NAME}.sqlite`,
  logging: process.env.PHANTOM_DB_LOGGING,
  redis: {
    host: process.env.PHANTOM_REDIS_HOST || 'localhost',
    port: process.env.PHANTOM_REDIS_PORT || 6379
  }
}
