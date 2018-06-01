'use strict'

module.exports = {
  dialect: 'sqlite',
  storage: process.env.ARK_DB_STORAGE || `${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK_NAME}.sqlite`,
  logging: false
}
