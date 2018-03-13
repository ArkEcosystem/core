const Sequelize = require('sequelize')
const onCancel = require('app/wizard/cancel')
const { sleep } = require('sleep')
const utils = require('app/wizard/utils')

module.exports = async () => {
  const config = utils.readConfig('server').database

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
