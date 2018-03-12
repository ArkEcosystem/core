const prompts = require('prompts')
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')

const start = async () => {
  clear()

  console.log(chalk.red(figlet.textSync('ARK Core', { font: 'Coinstak', horizontalLayout: 'full' })))

  const questions = [{
    type: 'select',
    name: 'action',
    message: 'What action would you like to perform?',
    choices: [
      { title: 'Start Forger', value: 'start-forger' },
      { title: 'Start Relay', value: 'start-relay' },
      { title: 'Configure Delegate', value: 'configure-delegate' },
      { title: 'Configure Database', value: 'configure-database' },
      { title: 'Configure Redis', value: 'configure-redis' },
      { title: 'Configure Public API', value: 'configure-public-api' },
      { title: 'Configure Webhooks', value: 'configure-webhooks' },
      { title: 'Purge Database', value: 'purge-database' },
      { title: 'Purge Installation', value: 'purge-install' }
    ]
  }]

  const response = await prompts(questions)

  if (!response.action) process.exit()

  require(`app/wizard/${response.action}`)(response)
}

start()
