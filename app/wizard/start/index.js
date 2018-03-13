const prompts = require('prompts')
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const questions = require('./questions')

const onCancel = () => process.exit()

module.exports = async () => {
  clear()

  console.log(chalk.red(figlet.textSync('ARK Core', { font: 'Coinstak', horizontalLayout: 'full' })))

  const response = await prompts(questions, { onCancel })

  if (!response.action) process.exit()

  require(`app/wizard/${response.action}`)(response)
}
