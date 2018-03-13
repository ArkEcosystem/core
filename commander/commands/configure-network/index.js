const fs = require('fs-extra')
const prompts = require('prompts')
const questions = require('./questions')

module.exports = async () => {
  const response = await prompts(questions, { onCancel: () => process.exit() })

  await fs.remove(process.env.ARK_CONFIG)
  await fs.copy(`./config/${response.network}`, process.env.ARK_CONFIG)

  return response.network
}
