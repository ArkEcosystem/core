const prompts = require('prompts')
const argon2 = require('argon2')
const questions = require('./questions')
const onCancel = require('../cancel')
const utils = require('../utils')

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })

  let config = utils.readConfig('webhooks')
  config.enabled = response.enabled
  config.password = await argon2.hash(response.password, { type: argon2.argon2id })

  return utils.writeConfig('webhooks', config)
}
