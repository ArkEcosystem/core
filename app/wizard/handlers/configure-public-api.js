const prompts = require('prompts')
const questions = require('app/wizard/questions/configure-public-api')

module.exports = async (answers) => {
  const response = await prompts(questions)
}
