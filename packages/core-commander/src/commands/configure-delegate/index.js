'use strict';

const prompts = require('prompts')
const questions = require('./questions')
const { onCancel, readConfig, writeConfig } = require('../../utils')
const { Delegate } = require('@arkecosystem/client').models
const { encrypt } = require('../../utils/forger-crypto')

module.exports = async () => {
  let response = await prompts(questions, { onCancel })

  let config = readConfig('delegates')

  const bip38 = Delegate.encrypt(response.secret, readConfig('network'), response.password)
  config.identity = encrypt(bip38, response.address, response.password)

  writeConfig('delegates', config)

  response = await prompts([{
    type: 'confirm',
    name: 'start',
    message: 'Your delegate has been configured. Would you like to start the forger?'
  }], { onCancel })

  response.start ? require('../start-forger')() : onCancel()
}
