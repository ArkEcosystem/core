'use strict';

const chalk = require('chalk')
const path = require('path')
const { startProcess } = require('../../utils')
const { sleep } = require('sleep')
const { onCancel } = require('../../utils')

/**
 * [description]
 * @return {[type]} [description]
 */
module.exports = async () => {
  startProcess({
    name: 'ark-core:relay',
    script: path.resolve(__dirname, '../../../src/start-relay.js'),
    args: [
      '--config', process.env.ARK_CONFIG
    ]
  }, () => {
    console.log(chalk.green('The relay node has been started.'))

    sleep(1)

    onCancel()
  })
}
