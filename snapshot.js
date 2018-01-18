const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const DB = require('./core/dbinterface')
const DependencyHandler = require('./core/dependency-handler')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))) {
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

require('./core/config').init({
  server: require(path.resolve(commander.config, 'server.json')),
  genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
  network: require(path.resolve(commander.config, 'network.json'))
}).then(config => {
  const logger = require('./core/logger')
  logger.init(config.server.fileLogLevel, config.network.name)

  process.on('unhandledRejection', (reason, p) => {
    logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
  })

  DependencyHandler
    .checkDatabaseLibraries(config)
    .then(() => DB.create(config.server.db))
    .then((db) => db.snapshot(`${__dirname}/snapshot`))
    .then(() => logger.info('Snapshot saved'))
    .catch(fatal => logger.error('fatal error', fatal))
})
