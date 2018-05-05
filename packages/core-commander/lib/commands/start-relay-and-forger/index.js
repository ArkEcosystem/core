'use strict'

const path = require('path')
const prompts = require('prompts')
const arkjs = require('arkjs')
const chalk = require('chalk')
const delay = require('delay')
const questions = require('./questions')
const { onCancel, readConfig, startProcess } = require('../../utils')
const { decrypt } = require('../../utils/forger-crypto')

module.exports = async () => {
  const identity = readConfig('delegates').identity

  if (!identity) await require('../configure-delegate')()

  const response = await prompts(questions, { onCancel })

  if (response.password) {
    try {
      const [bip38, address] = decrypt(identity, response.password)

      if (arkjs.crypto.validateAddress(address, readConfig('network').pubKeyHash)) {
        startProcess({
          name: 'ark-core:relay-and-forger',
          script: path.resolve(__dirname, '../../../lib/start-relay-and-forger.js'),
          args: [
            '--config', process.env.ARK_PATH_CONFIG,
            '--bip38', bip38,
            '--address', address,
            '--password', response.password
          ]
        }, async () => {
          console.log(chalk.green('The relay node and forger have been started.'))

          await delay(1000)

          onCancel()
        })
      }

      console.log(chalk.red('The provided address could not be validated.'))
    } catch (error) {
      console.log(chalk.red('The provided password could not be validated.'))
    }

    await delay(1000)

    onCancel()
  }
}
