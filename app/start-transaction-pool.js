const commander = require('commander')
const packageJson = require('../package.json')
const config = require('app/core/config')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

config.init(require('config')(commander.config))
