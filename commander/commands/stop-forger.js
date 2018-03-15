const chalk = require('chalk')
const { sleep } = require('sleep')
const { onCancel, stopProcess, getProcessStatus } = require('../utils')

module.exports = async () => {
  stopProcess('ark-core:forger', () => {
    console.log(chalk.bgRed('The forger has been stopped.'))

    getProcessStatus(() => {
      sleep(1)

      onCancel()
    })
  })
}
