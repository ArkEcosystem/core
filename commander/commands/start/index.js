const prompts = require('prompts')
const splash = require('../splash')
const questions = require('./questions')

module.exports = async () => {
  splash()

  const response = await prompts(questions, { onCancel: () => process.exit() })

  if (response.action === 'exit') process.exit()

  require(`app/commander/${response.action}`)(response)
}
