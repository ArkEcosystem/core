'use strict'

const chalk = require('chalk')
const delay = require('delay')
const { onCancel, stopProcess } = require('../utils')

module.exports = async () => {
  stopProcess('ark-core:relay-and-forger', async () => {
    console.log(chalk.red('The relay node and forger have been stopped.'))

    await delay(1000)

    onCancel()
  })
}
