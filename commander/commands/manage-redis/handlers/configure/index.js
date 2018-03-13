const prompts = require('prompts')
const questions = require('./questions')
const { onCancel, readConfig, writeConfig } = require('commander/utils')

module.exports = async (answers) => {
  let config = readConfig('server')
  config.redis = await prompts(questions, { onCancel })

  return writeConfig('server', config)
}
