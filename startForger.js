global.__root = __dirname + '/';

const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const config = require('./core/config')
const ForgerManager = require('./core/forgerManager')

let forgerManager = null

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

if (commander.config) {
  config.init({
    server: require(path.resolve(commander.config, 'server.json')),
    genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
    network: require(path.resolve(commander.config, 'network.json')),
    delegates: require(path.resolve(commander.config, 'delegate.json'))
  })
}

const logger = require('./core/logger')
logger.init(config.server.fileLogLevel, config.network.name + '-forger')

forgerManager = new ForgerManager(config)

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

forgerManager
  .loadDelegates()
  .then((forgers) => logger.info('ForgerManager started with', forgers.length, 'forgers'))
  .then(() => forgerManager.startForging('http://127.0.0.1:4000'))
  .catch((fatal) => logger.error('fatal error', fatal))
