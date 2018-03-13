module.exports = [{
  type: 'select',
  name: 'action',
  message: 'What action would you like to perform?',
  choices: [
    { title: 'Start Forger', value: 'start-forger' },
    { title: 'Start Relay', value: 'start-relay' },
    { title: 'Manage Database', value: 'manage-database' },
    { title: 'Manage Redis', value: 'manage-redis' },
    { title: 'Configure Network', value: 'configure-network' },
    { title: 'Configure Delegate', value: 'configure-delegate' },
    { title: 'Configure Public API', value: 'configure-public-api' },
    { title: 'Configure Webhooks', value: 'configure-webhooks' },
    { title: 'Show Logs', value: 'show-logs' },
    { title: 'Exit', value: 'exit' }
  ]
}]
