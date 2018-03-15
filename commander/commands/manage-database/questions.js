module.exports = [{
  type: 'select',
  name: 'action',
  message: 'What action would you like to perform?',
  choices: [
    { title: 'Configure Connection', value: 'configure' },
    { title: 'Test Connection', value: 'test' },
    // { title: 'Drop Database Tables', value: 'drop' },
    { title: 'Back to Main Menu', value: '../../back-to-main-menu' }
  ]
}]
