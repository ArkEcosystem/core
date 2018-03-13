const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')

exports.readConfig = (file) => require(`config/${process.env.NETWORK}/${file}.json`)

exports.writeConfig = async (file, data) => writeFile(`config/${process.env.NETWORK}/${file}.json`, JSON.stringify(data, null, 2))

exports.splash = async () => {
  clear()

  console.log(chalk.red(figlet.textSync('ARK Core', { font: 'Coinstak', horizontalLayout: 'full' })))
}

exports.onCancel = prompt => require('./commands/start')()
