const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('app/wizard/cancel')
const utils = require('app/wizard/utils')

module.exports = async (answers) => {
  let config = utils.readConfig('server')
  config.redis = await prompts(questions, { onCancel })

  return utils.writeConfig('server', config)
}
