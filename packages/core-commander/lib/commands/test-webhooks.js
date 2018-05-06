'use strict'

const Sequelize = require('sequelize')
const Redis = require('ioredis')
const chalk = require('chalk')
const expandHomeDir = require('expand-home-dir')
const delay = require('delay')
const { onCancel, readPluginConfig } = require('../utils')

function testRedisConnection () {
  const client = new Redis(readPluginConfig('@arkecosystem/core-webhooks').redis)

  client.on('connect', async () => {
    console.log(chalk.green('Redis connection established.'))

    await delay(3000)

    onCancel()
  }).on('error', async (error) => {
    console.log(chalk.red('Redis connection not established.'))
    console.log(chalk.red(error.message))

    await delay(3000)

    onCancel()
  })
}

async function testDatabaseConnection () {
  const config = readPluginConfig('@arkecosystem/core-webhooks').database

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

    await delay(3000)

    onCancel()
  } catch (error) {
    console.log(chalk.red('Unable to connect to the database:'))
    console.log(chalk.red(error.stack))

    await delay(3000)

    onCancel()
  }
}

module.exports = async () => {
  await testDatabaseConnection()

  testRedisConnection()
}
