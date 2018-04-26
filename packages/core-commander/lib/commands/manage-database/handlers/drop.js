'use strict';

const Sequelize = require('sequelize')
const Umzug = require('umzug')
const path = require('path')
const { readConfig } = require('../../../utils')

module.exports = async () => {
  const config = readConfig('server').database

  const database = new Sequelize(config.options.uri, {
    dialect: config.options.dialect,
    logging: config.options.logging,
    operatorsAliases: Sequelize.Op
  })

  await database.authenticate()

  const umzug = new Umzug({
    storage: 'sequelize',
    logging: console.log,
    storageOptions: {
      sequelize: database
    },
    migrations: {
      params: [
        database.getQueryInterface(),
        Sequelize
      ],
      path: path.join(__dirname, '../../../../@arkecosystem/core-database-sequelize/migrations')
    }
  })

  return umzug.down({ to: 0 })
}
