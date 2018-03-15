const chalk = require('chalk')
const { sleep } = require('sleep')
const { onCancel, stopProcess, getProcessStatus } = require('../utils')

module.exports = async () => {
  stopProcess('ark-core:relay-and-forger', () => {
    console.log(chalk.bgRed('The relay node and forger have been stopped.'))

    getProcessStatus()

    sleep(1)

    onCancel()
  })
}
