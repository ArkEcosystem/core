module.exports = {
  initialization: {
    capSQL: true,
    promiseLib: require('bluebird'),
    noLocking: process.env.NODE_ENV === 'test',
  },
  connection: {
    host: process.env.PHANTOM_DB_HOST || 'localhost',
    port: process.env.PHANTOM_DB_PORT || 5432,
    database:
      process.env.PHANTOM_DB_DATABASE || `phantom_${process.env.PHANTOM_NETWORK_NAME}`,
    user: process.env.PHANTOM_DB_USERNAME || 'phantom',
    password: process.env.PHANTOM_DB_PASSWORD || 'password',
  },
}
