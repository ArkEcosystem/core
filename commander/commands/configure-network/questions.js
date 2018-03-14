module.exports = [{
  type: 'select',
  name: 'network',
  message: 'What network are you on?',
  choices: [
    { title: 'Main / Production', value: 'mainnet' },
    { title: 'Development', value: 'devnet' },
    { title: 'Test', value: 'testnet' }
  ]
}]
