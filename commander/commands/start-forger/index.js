const path = require('path')
const prompts = require('prompts')
const arkjs = require('arkjs')
const chalk = require('chalk')
const { sleep } = require('sleep')
const questions = require('./questions')
const { onCancel, readConfig, startProcess } = require('../../utils')
const { decrypt } = require('../../../app/utils/forger-crypto')

module.exports = async () => {
  const identity = readConfig('delegates').identity

  if (!identity) await require('../configure-delegate')()

  const response = await prompts(questions, { onCancel })

  if (response.password) {
    try {
      const [bip38, address] = decrypt(identity, response.password)

      if (arkjs.crypto.validateAddress(address, readConfig('network').pubKeyHash)) {
        startProcess({
          name: 'ark-core:forger',
          script: path.resolve(__dirname, '../../../app/start-forger.js'),
          args: [
            '--config', process.env.ARK_CONFIG,
            '--bip38', bip38,
            '--address', address,
            '--password', response.password
          ]
        }, () => {
          console.log('The forger has been started.')

          sleep(1)

          onCancel()
        })
      }

      console.log(chalk.bgRed('The provided address could not be validated.'))
    } catch (error) {
      console.log(chalk.bgRed('The provided password could not be validated.'))
    }

    sleep(1)

    onCancel()
  }
}
