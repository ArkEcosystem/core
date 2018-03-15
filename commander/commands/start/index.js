const prompts = require('prompts')
const { splash } = require('../../utils')
const questions = require('./questions')

module.exports = async () => {
  splash()

  const response = await prompts(questions, { onCancel: () => process.exit() })

  if (response.action === 'exit') process.exit()

  require(`../${response.action}`)(response)
}
