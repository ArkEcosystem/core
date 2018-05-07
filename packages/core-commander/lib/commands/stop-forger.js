'use strict'

const chalk = require('chalk')
const delay = require('delay')
const { onCancel, stopProcess } = require('../utils')

module.exports = async () => {
  stopProcess('ark-core:forger', async () => {
    console.log(chalk.red('The forger has been stopped.'))

    await delay(1000)

    onCancel()
  })
}
