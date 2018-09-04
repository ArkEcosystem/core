'use strict'

module.exports = {
  initialization: {},
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'ark_devnet',
    user: 'ark',
    password: 'password'
  },
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  }
}
