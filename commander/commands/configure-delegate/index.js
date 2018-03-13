const prompts = require('prompts')
const questions = require('./questions')
const { onCancel, readConfig, writeConfig } = require('commander/utils')
const Delegate = require('app/models/delegate')

module.exports = async () => {
  const response = await prompts(questions, { onCancel })

  let config = readConfig('delegates')
  config['bip38'] = Delegate.encrypt(response.secret, readConfig('network'), response.password)

  return writeConfig('delegates', config)
}
