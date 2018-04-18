'use strict';

const prompts = require('prompts')
const argon2 = require('argon2')
const questions = require('./questions')
const { onCancel, readConfig, writeConfig } = require('../../utils')

module.exports = async () => {
  const response = await prompts(questions, { onCancel })

  let config = readConfig('webhooks')
  config.enabled = response.enabled
  config.password = await argon2.hash(response.password, { type: argon2.argon2id })

  return writeConfig('webhooks', config)
}
