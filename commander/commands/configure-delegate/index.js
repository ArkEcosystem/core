const prompts = require('prompts')
const questions = require('./questions')
const { onCancel } = require('commander/utils')

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })
}
