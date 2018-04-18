'use strict';

const prompts = require('prompts')
const questions = require('./questions')
const { onCancel, readConfig, writeConfig } = require('../../../utils')

module.exports = async () => {
  const response = await prompts(questions, { onCancel })

  let config = readConfig('api/public')
  config.rateLimit = response.rateLimit

  return writeConfig('api/public', config)
}
