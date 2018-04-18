'use strict';

const prompts = require('prompts')
const questions = require('./questions')
const { onCancel, readConfig, writeConfig } = require('../../../utils')

/**
 * [description]
 * @return {[type]} [description]
 */
module.exports = async () => {
  let config = readConfig('server')
  config.redis = await prompts(questions, { onCancel })

  return writeConfig('server', config)
}
