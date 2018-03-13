const prompts = require('prompts')
const splash = require('../splash')
const questions = require('./questions')

module.exports = async () => {
  splash()

  const response = await prompts(questions, { onCancel: () => process.exit() })

  require(`app/wizard/${response.action}`)(response)
}
