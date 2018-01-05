const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const config = require('./core/config')
const logger = require('./core/logger')
const ForgerManager = require('./core/forgerManager')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))){
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

config.init({
  server: require(path.resolve(commander.config, 'server.json')),
  genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
  network: require(path.resolve(commander.config, 'network.json')),
  delegates: require(path.resolve(commander.config, 'delegate.json'))
})

logger.init(config.server.fileLogLevel, config.network.name + '-forger')

let forgerManager = new ForgerManager(config)

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

forgerManager
  .loadDelegates()
  .then((forgers) => logger.info('ForgerManager started with', forgers.length, 'forgers'))
  .then(() => forgerManager.startForging('http://127.0.0.1:4000'))
  .catch((fatal) => logger.error('fatal error', fatal))
