const chalk = require('chalk')

module.exports = [{
  type: 'confirm',
  name: 'agreed',
  message: `Are you sure you want to reset your configuration? ${chalk.bgRed('This action cannot be undone.')}`
}]
