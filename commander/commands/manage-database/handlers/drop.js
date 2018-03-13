const Sequelize = require('sequelize')
const Umzug = require('umzug')
const path = require('path')
const { readConfig } = require('commander/utils')

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
    storageOptions: {
      sequelize: db
    },
    migrations: {
      params: [
        db.getQueryInterface(),
        Sequelize
      ],
      path: path.join(__dirname, '../../../database/sequelize/migrations')
    }
  })

  return umzug.down({ to: 0 })
}
