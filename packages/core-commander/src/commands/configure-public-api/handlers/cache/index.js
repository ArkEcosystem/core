'use strict';

const prompts = require('prompts')
const questions = require('./questions')
const { onCancel, readConfig, writeConfig } = require('../../../utils')

/**
 * [description]
 * @return {[type]} [description]
 */
module.exports = async () => {
  const response = await prompts(questions, { onCancel })

  let config = readConfig('api/public')
  config.cache.enabled = response.enabled
  config.cache.options.host = response.host
  config.cache.options.port = response.port
  config.cache.options.expiresIn = response.expiresIn

  return writeConfig('api/public', config)
}
