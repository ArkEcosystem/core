const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('app/wizard/cancel')

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })

  if (response.action) require(`./handlers/${response.action}`)()
}
