'use strict'

module.exports = {
  initialization: {
    capSQL: true,
    promiseLib: require('bluebird'),
    noLocking: process.env.NODE_ENV === 'test'
  },
  connection: {
    host: process.env.ARK_DB_HOST || 'localhost',
    port: process.env.ARK_DB_PORT || 5432,
    database: process.env.ARK_DB_DATABASE || `ark_${process.env.ARK_NETWORK_NAME}`,
    user: process.env.ARK_DB_USERNAME || 'ark',
    password: process.env.ARK_DB_PASSWORD || 'password'
  }
}
