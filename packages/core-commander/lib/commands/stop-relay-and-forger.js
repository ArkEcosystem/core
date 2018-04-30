'use strict';

const chalk = require('chalk')
const { sleep } = require('sleep')
const { onCancel, stopProcess } = require('../utils')

module.exports = async () => {
  stopProcess('ark-core:relay-and-forger', () => {
    console.log(chalk.red('The relay node and forger have been stopped.'))

    sleep(1)

    onCancel()
  })
}
