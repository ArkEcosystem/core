const prompts = require('prompts')
const questions = require('app/wizard/questions/configure-purge')

module.exports = async (answers) => {
  const response = await prompts(questions)
}
