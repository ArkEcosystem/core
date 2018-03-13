const Sequelize = require('sequelize')
const config = require(`config/${process.env.NETWORK}/server.json`).database

module.exports = async () => {
  const db = new Sequelize(config.options.uri, {
    dialect: config.options.dialect,
    logging: config.options.logging,
    operatorsAliases: Sequelize.Op
  })

  try {
    await db.authenticate()

    console.log('Database connection has been established.')
  } catch (error) {
    console.error('Unable to connect to the database:', error.stack)
  }
}
