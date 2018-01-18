const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const logger = require('./core/logger')
const BlockchainManager = require('./core/blockchainManager')
const P2PInterface = require('./api/p2p/p2pinterface')
const DB = require('./core/dbinterface')
const Cache = require('./core/cache')
const Queue = require('./core/queue')
const DependencyHandler = require('./core/dependency-handler')
const PublicAPI = require('./api/public')

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
  logger.init(config.server.fileLogLevel, config.network.name)

  const blockchainManager = new BlockchainManager(config)
  const p2p = new P2PInterface(config)

  process.on('unhandledRejection', (reason, p) => {
    logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
  })

  DependencyHandler
    .checkDatabaseLibraries(config)
    .then(() => new Queue(config.server.redis))
    .then(() => new Cache(config.server.redis))
    .then(() => DB.create(config.server.db))
    .then(db => blockchainManager.attachDBInterface(db))
    .then(() => logger.info('Database started'))
    .then(() => p2p.warmup())
    .then(() => logger.info('Network interface started'))
    .then(() => blockchainManager.attachNetworkInterface(p2p).init())
    .then(lastBlock => logger.info('Blockchain connnected, local lastBlock', (lastBlock.data || { height: 0 }).height))
    .then(() => blockchainManager.start())
    .then(() => logger.info('Mounting Public API'))
    .then(() => new PublicAPI(config).mount())
    .catch(fatal => logger.error('fatal error', fatal))
})
