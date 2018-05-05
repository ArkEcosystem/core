'use strict'

const Redis = require('ioredis')
const chalk = require('chalk')
const { onCancel, readPluginConfig } = require('../utils')
const delay = require('delay')

module.exports = async () => {
  const client = new Redis(readPluginConfig('@arkecosystem/core-transaction-pool-redis').redis)

  client.on('connect', async () => {
    console.log(chalk.green('Redis connection established.'))

    await delay(1000)

    onCancel()
  }).on('error', async (error) => {
    console.log(chalk.red('Redis connection not established.'))
    console.log(chalk.red(error.message))

    await delay(3000)

    onCancel()
  })
}
