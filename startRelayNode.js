const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const goofy = require('./core/goofy')
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

const config = require('./core/config')
let blockchainManager = null
let p2p = null

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

config.init({
  server: require(path.resolve(commander.config, 'server.json')),
  genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
  network: require(path.resolve(commander.config, 'network.json'))
})
.then(() => goofy.init(config.server.consoleLogLevel, config.server.fileLogLevel, config.network.name))
.then(() => (blockchainManager = new BlockchainManager(config)))
.then(() => (p2p = new P2PInterface(config)))
.then(() => DependencyHandler.checkDatabaseLibraries(config))
// .then(() => new Queue(config.server.redis))
// .then(() => new Cache(config.server.redis))
.then(() => DB.create(config.server.db))
.then(db => blockchainManager.attachDBInterface(db))
.then(() => goofy.info('Database started'))
.then(() => p2p.warmup())
.then(() => goofy.info('Network interface started'))
.then(() => blockchainManager.attachNetworkInterface(p2p))
.then(() => blockchainManager.start())
.then(() => goofy.info('Mounting Public API'))
.then(() => PublicAPI(config))
.catch(fatal => goofy.error('fatal error', fatal))
