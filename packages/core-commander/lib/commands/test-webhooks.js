'use strict';

const Sequelize = require('sequelize')
const Redis = require('ioredis')
const chalk = require('chalk')
const expandHomeDir = require('expand-home-dir')
const { sleep } = require('sleep')
const { onCancel, readPluginConfig } = require('../utils')

function testRedisConnection () {
  const client = new Redis(readPluginConfig('@arkecosystem/core-webhooks').redis)

  client.on('connect', () => {
    console.log(chalk.green('Redis connection established.'))

    sleep(3)

    onCancel()
  }).on('error', (error) => {
    console.log(chalk.red('Redis connection not established.'))
    console.log(chalk.red(error.message))

    sleep(3)

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

    sleep(3)

    onCancel()
  } catch (error) {
    console.log(chalk.red('Unable to connect to the database:'))
    console.log(chalk.red(error.stack))

    sleep(3)

    onCancel()
  }
}

module.exports = async () => {
  await testDatabaseConnection()

  testRedisConnection()
}
