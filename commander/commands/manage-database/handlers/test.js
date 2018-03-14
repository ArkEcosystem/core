const Sequelize = require('sequelize')
const { onCancel, readConfig } = require('commander/utils')
const { sleep } = require('sleep')

module.exports = async () => {
  const config = readConfig('server').database

  const db = new Sequelize(config.options.uri, {
    dialect: config.options.dialect,
    logging: config.options.logging,
    operatorsAliases: Sequelize.Op
  })

  try {
    await db.authenticate()

    console.log('Database connection has been established.')

    sleep(1)

    onCancel()
  } catch (error) {
    console.error('Unable to connect to the database:', error.stack)
  }
}
