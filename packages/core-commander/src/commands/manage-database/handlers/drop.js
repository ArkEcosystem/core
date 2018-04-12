const Sequelize = require('sequelize')
const Umzug = require('umzug')
const path = require('path')
const { readConfig } = require('../../../utils')

module.exports = async () => {
  const config = readConfig('server').database

  const db = new Sequelize(config.options.uri, {
    dialect: config.options.dialect,
    logging: config.options.logging,
    operatorsAliases: Sequelize.Op
  })

  await db.authenticate()

  const umzug = new Umzug({
    storage: 'sequelize',
    logging: console.log,
    storageOptions: {
      sequelize: db
    },
    migrations: {
      params: [
        db.getQueryInterface(),
        Sequelize
      ],
      path: path.join(__dirname, '../../../../@arkecosystem/core-db-sequelize/migrations')
    }
  })

  return umzug.down({ to: 0 })
}
