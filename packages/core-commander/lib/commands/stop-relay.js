'use strict';

const chalk = require('chalk')
const { sleep } = require('sleep')
const { onCancel, stopProcess } = require('../utils')

/**
 * [description]
 * @return {[type]} [description]
 */
module.exports = async () => {
  stopProcess('ark-core:relay', () => {
    console.log(chalk.bgRed('The relay node has been stopped.'))

    sleep(1)

    onCancel()
  })
}
