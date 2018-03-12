const prompts = require('prompts')
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')

const start = async () => {
  clear()

  console.log(chalk.blue(figlet.textSync('ARK Core', { font: 'Coinstak', horizontalLayout: 'full' })))

  let questions = [{
    type: 'select',
    name: 'action',
    message: 'What action would you like to perform?',
    choices: [
      { title: 'Start Delegate', value: 'start-delegate' },
      { title: 'Configure Delegate', value: 'configure-delegate' },
      { title: 'Configure Database', value: 'configure-database' },
      { title: 'Configure Redis', value: 'configure-redis' },
      { title: 'Configure Public API', value: 'configure-public-api' },
      { title: 'Configure Webhooks', value: 'configure-webhooks' },
      { title: 'Purge Database', value: 'purge-database' },
      { title: 'Purge Installation', value: 'purge-install' }
    ]
  }]

  let response = await prompts(questions)

  if (!response.action) {
    console.error('Invalid configuration provided, exiting application.')

    process.exit()
  }

  require(`app/wizard/${response.action}`)(response)
}

start()
