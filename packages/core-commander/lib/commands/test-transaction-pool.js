'use strict';

const Redis = require('ioredis')
const chalk = require('chalk')
const { onCancel, readPluginConfig } = require('../utils')
const { sleep } = require('sleep')

module.exports = async () => {
  const client = new Redis(readPluginConfig('@arkecosystem/core-transaction-pool-redis').redis)

  client.on('connect', () => {
    console.log(chalk.green('Redis connection established.'))

    sleep(1)

    onCancel()
  }).on('error', (error) => {
    console.log(chalk.red('Redis connection not established.'))
    console.log(chalk.red(error.message))

    sleep(3)

    onCancel()
  })
}
