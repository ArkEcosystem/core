'use strict'

const chalk = require('chalk')
const { sleep } = require('sleep')
const { onCancel, stopProcess } = require('../utils')

module.exports = async () => {
  stopProcess('ark-core:forger', () => {
    console.log(chalk.red('The forger has been stopped.'))

    sleep(1)

    onCancel()
  })
}
