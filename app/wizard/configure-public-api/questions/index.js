module.exports = [{
  type: 'select',
  name: 'action',
  message: 'What action would you like to perform?',
  choices: [
    { title: 'Enable Public API', value: 'enable' },
    { title: 'Configure Cache', value: 'cache' },
    { title: 'Configure Rate Limiting', value: 'rate-limit' },
    { title: 'Disable Public API', value: 'disable' }
  ]
}]
