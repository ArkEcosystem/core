const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('../cancel')

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })

  require(`./handlers/${response.action}`)()
}
