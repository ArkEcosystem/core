const chalk = require('chalk')

module.exports = [{
  type: 'select',
  name: 'network',
  message: `What network are you on? ${chalk.bgRed('Make sure you created a backup of your previous configuration if there is any!')}`,
  choices: [
    { title: 'Main / Production', value: 'mainnet' },
    { title: 'Development', value: 'devnet' },
    { title: 'Test', value: 'testnet' }
  ]
}]
