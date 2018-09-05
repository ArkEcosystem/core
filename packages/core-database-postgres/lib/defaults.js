'use strict'

module.exports = {
  initialization: {},
  connection: {
    host: process.env.ARK_DB_HOST || 'localhost',
    port: process.env.ARK_DB_PORT || 5432,
    database: process.env.ARK_DB_USERNAME || `ark_${process.env.ARK_NETWORK_NAME}`,
    user: process.env.ARK_DB_PASSWORD || 'ark',
    password: process.env.ARK_DB_DATABASE || 'password'
  },
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  }
}
