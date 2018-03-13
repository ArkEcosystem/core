const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('app/wizard/cancel')
const utils = require('app/wizard/utils')

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })

  let config = utils.readConfig('api/public')
  config.rateLimit = response.rateLimit

  return utils.writeConfig('api/public', config)
}
