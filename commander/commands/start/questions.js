const relayChoice = (process.env.ARK_RELAY_STATUS === 'offline')
  ? { title: 'Start Relay', value: 'start-relay' }
  : { title: 'Stop Relay', value: 'stop-relay' }

const forgerChoice = (process.env.ARK_FORGER_STATUS === 'offline')
  ? { title: 'Start Forger', value: 'start-forger' }
  : { title: 'Stop Forger', value: 'stop-forger' }

const relayForgerChoice = (process.env.ARK_RELAY_FORGER_STATUS === 'offline')
  ? { title: 'Start Relay & Forger', value: 'start-relay-and-forger' }
  : { title: 'Stop Relay & Forger', value: 'stop-relay-and-forger' }

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

module.exports = [{
  type: 'select',
  name: 'action',
  message: 'What action would you like to perform?',
  choices
}]
