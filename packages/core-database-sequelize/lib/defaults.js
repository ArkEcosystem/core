'use strict'

module.exports = {
  uri: `sqlite:${process.env.ARK_PATH_DATA}/database/devnet.sqlite`,
  uri_1: 'postgres://node:password@localhost:5432/ark_devnet',
  dialect: 'sqlite',
  dialect_1: 'postgres',
  logging: false
}
