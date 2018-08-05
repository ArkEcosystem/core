'use strict'

module.exports = {
  enabled: true,
  maxTransactionsPerSender: 100,
  allowedSenders: ['03dde379eb1da857f523c3b3560eb4bb7b99897df2054bd9774f49dd0371ee99b7'],
  database: {
    dialect: 'sqlite',
    storage: `${process.env.ARK_PATH_DATA}/database/pool.sqlite`,
    logging: process.env.ARK_DB_LOGGING || false
  }
}
