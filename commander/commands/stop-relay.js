const chalk = require('chalk')
const { sleep } = require('sleep')
const { onCancel, stopProcess, getProcessStatus } = require('../utils')

module.exports = async () => {
  stopProcess('ark-core:relay', () => {
    console.log(chalk.bgRed('The relay node has been stopped.'))

    getProcessStatus(() => {
      sleep(1)

      onCancel()
    })
  })
}
