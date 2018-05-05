'use strict'

const chalk = require('chalk')
const delay = require('delay')
const { onCancel, stopProcess } = require('../utils')

module.exports = async () => {
  stopProcess('ark-core:relay', async () => {
    console.log(chalk.red('The relay node has been stopped.'))

    await delay(1000)

    onCancel()
  })
}
