const prompts = require('prompts')

const start = async () => {
  let questions = [{
    type: 'select',
    name: 'action',
    message: 'What action would you like to perform?',
    choices: [
      { title: 'Start Delegate', value: 'start-delegate' },
      { title: 'Configure Delegate', value: 'configure-delegate' },
      { title: 'Configure Database', value: 'configure-database' },
      { title: 'Configure Public API', value: 'configure-public-api' },
      { title: 'Configure Explorer API', value: 'configure-explorer-api' },
      { title: 'Configure Webhooks', value: 'configure-webhooks' },
      { title: 'Purge Database', value: 'purge-database' },
      { title: 'Purge Installation', value: 'purge-install' }
    ]
  }]

  let onCancel = prompt => {
    console.log('Never stop prompting!')
    return true
  }

  let response = await prompts(questions, { onCancel })

  if (!response.action) {
    console.error('Invalid configuration provided, exiting application.')

    process.exit()
  }

  require(`app/wizard/handlers/${response.action}`)(response)
}

start()
