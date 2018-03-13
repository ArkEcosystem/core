const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')

module.exports = async () => {
  clear()

  console.log(chalk.red(figlet.textSync('ARK Core', { font: 'Coinstak', horizontalLayout: 'full' })))
}
