module.exports = [{
  type: 'select',
  name: 'network',
  message: 'What network are you on?',
  choices: [
    { title: 'Mainnet', value: 'mainnet' },
    { title: 'Devnet', value: 'devnet' },
    { title: 'Testnet', value: 'testnet' }
  ]
}, {
  type: 'password',
  name: 'passphrase',
  message: 'What is your passphrase?'
}, {
  type: 'password',
  name: 'password',
  message: 'What is your password?'
}]
