const prompts = require('prompts')
const questions = require('app/wizard/questions/configure-webhooks')

module.exports = async (answers) => {
  const response = await prompts(questions)
}
