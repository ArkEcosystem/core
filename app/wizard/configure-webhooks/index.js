const prompts = require('prompts')
const questions = require('./questions')

module.exports = async (answers) => {
  const response = await prompts(questions)
}
