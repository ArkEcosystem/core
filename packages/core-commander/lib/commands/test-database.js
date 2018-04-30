'use strict';

const Sequelize = require('sequelize')
const chalk = require('chalk')
const expandHomeDir = require('expand-home-dir')
const { sleep } = require('sleep')
const { onCancel, readPluginConfig } = require('../utils')

module.exports = async () => {
  const config = readPluginConfig('@arkecosystem/core-database-sequelize')

  if (config.dialect === 'sqlite') {
    const databasePath = expandHomeDir(config.uri.substring(7))

    config.uri = `sqlite:${databasePath}`
  }

  try {
    const database = new Sequelize(config.uri, {
      dialect: config.dialect,
      logging: config.logging,
      operatorsAliases: Sequelize.Op
    })

    await database.authenticate()

    console.log(chalk.green('Database connection has been established.'))

    sleep(1)

    onCancel()
  } catch (error) {
    console.log(chalk.red('Unable to connect to the database:'))
    console.log(chalk.red(error.stack))

    sleep(1)

    onCancel()
  }
}
