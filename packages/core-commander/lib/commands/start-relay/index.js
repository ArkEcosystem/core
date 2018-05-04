'use strict'

const chalk = require('chalk')
const path = require('path')
const { startProcess } = require('../../utils')
const { sleep } = require('sleep')
const { onCancel } = require('../../utils')

module.exports = async () => {
  startProcess({
    name: 'ark-core:relay',
    script: path.resolve(__dirname, '../../../lib/start-relay.js'),
    args: [
      '--config', process.env.ARK_PATH_CONFIG
    ]
  }, () => {
    console.log(chalk.green('The relay node has been started.'))

    sleep(1)

    onCancel()
  })
}
