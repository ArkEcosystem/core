const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const goofy = require('./core/goofy')
const ForgerManager = require('./core/forgerManager')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))) {
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

const config = require('./core/config')
let forgerManager = null
let forgers = null

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

config.init({
  server: require(path.resolve(commander.config, 'server.json')),
  genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
  network: require(path.resolve(commander.config, 'network.json')),
  delegates: require(path.resolve(commander.config, 'delegate.json'))
})
  .then(() => goofy.init(config.server.fileLogLevel, config.network.name + '-forger'))
  .then(() => (forgerManager = new ForgerManager(config)))
  .then(() => (forgers = forgerManager.loadDelegates()))
  .then(() => goofy.info('ForgerManager started with', forgers.length, 'forgers'))
  .then(() => forgerManager.startForging('http://127.0.0.1:4000'))
  .catch((fatal) => goofy.error('fatal error', fatal))
