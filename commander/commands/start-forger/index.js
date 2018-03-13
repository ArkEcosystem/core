const prompts = require('prompts')
const arkjs = require('arkjs')
const chalk = require('chalk')
const { sleep } = require('sleep')
const questions = require('./questions')
const { onCancel, readConfig } = require('commander/utils')

module.exports = async () => {
  if (!readConfig('delegates').bip38) await require('../configure-delegate')()

  const response = await prompts(questions, { onCancel })

  if (response.password && response.address) {
    if (arkjs.crypto.validateAddress(response.address, readConfig('network').pubKeyHash)) {
      return console.log('start forger with password & address')
    }

    console.log(chalk.bgRed('The provided address could not be validated.'))

    sleep(1)

    onCancel()
  }
}
