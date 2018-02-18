const commander = require('commander')
const packageJson = require('../package.json')
const config = require('app/core/config')
const logger = require('app/core/logger')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => logger.error(`Unhandled Rejection at: ${p} reason: ${reason}`))

config.init(commander.config)
