const prompts = require('prompts')
const { splash } = require('../../utils')

const questions = () => {
  const relayChoice = process.env.ARK_RELAY_STATUS === 'online'
    ? { title: 'Stop Relay', value: 'stop-relay' }
    : { title: 'Start Relay', value: 'start-relay' }

  const forgerChoice = process.env.ARK_FORGER_STATUS === 'online'
    ? { title: 'Stop Forger', value: 'stop-forger' }
    : { title: 'Start Forger', value: 'start-forger' }

  const relayForgerChoice = process.env.ARK_RELAY_FORGER_STATUS === 'online'
    ? { title: 'Stop Relay & Forger', value: 'stop-relay-and-forger' }
    : { title: 'Start Relay & Forger', value: 'start-relay-and-forger' }

  const choices = [
    relayChoice,
    forgerChoice,
    relayForgerChoice,
    { title: 'Manage Database', value: 'manage-database' },
    { title: 'Manage Redis', value: 'manage-redis' },
    { title: 'Configure Network', value: 'configure-network' },
    { title: 'Configure Delegate', value: 'configure-delegate' },
    { title: 'Configure Public API', value: 'configure-public-api' },
    { title: 'Configure Webhooks', value: 'configure-webhooks' },
    { title: 'Show Logs', value: 'show-logs' },
    { title: 'Exit', value: 'exit' }
  ]

  return [{
    type: 'select',
    name: 'action',
    message: 'What action would you like to perform?',
    choices
  }]
}

module.exports = async () => {
  splash()

  const response = await prompts(questions(), { onCancel: () => process.exit() })

  if (response.action === 'exit') process.exit()

  require(`../${response.action}`)(response)
}
