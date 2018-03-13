const prompts = require('prompts')
const arkjs = require('arkjs')
const chalk = require('chalk')
const { sleep } = require('sleep')
const questions = require('./questions')
const { onCancel, readConfig } = require('commander/utils')
const { decrypt } = require('app/utils/forger-crypto')

module.exports = async () => {
  const identity = readConfig('delegates').identity

  if (!identity) await require('../configure-delegate')()

  const response = await prompts(questions, { onCancel })

  if (response.password) {
    try {
      const [bip38, address] = decrypt(identity, response.password)

      if (arkjs.crypto.validateAddress(address, readConfig('network').pubKeyHash)) {
        return console.log('start forger with bip38, password and address')
      }

      console.log(chalk.bgRed('The provided address could not be validated.'))
    } catch (error) {
      console.log(chalk.bgRed('The provided password could not be validated.'))
    }

    sleep(1)

    onCancel()
  }
}
