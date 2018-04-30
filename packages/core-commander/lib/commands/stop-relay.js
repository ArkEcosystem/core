'use strict';

const chalk = require('chalk')
const { sleep } = require('sleep')
const { onCancel, stopProcess } = require('../utils')

module.exports = async () => {
  stopProcess('ark-core:relay', () => {
    console.log(chalk.red('The relay node has been stopped.'))

    sleep(1)

    onCancel()
  })
}
