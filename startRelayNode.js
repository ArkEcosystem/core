const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const config = require('./core/config')
const BlockchainManager = require('./core/blockchainManager')
const P2PInterface = require('./api/p2p/p2pinterface')
const DB = require('./core/dbinterface')
const PublicAPI = require('./api/public/api')

let blockchainManager = null
let p2p = null

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

if (commander.config) {
  config.init({
    server: require(path.resolve(commander.config, 'server.json')),
    genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
    network: require(path.resolve(commander.config, 'network.json'))
  })
}

const logger = require('./core/logger')
logger.init(config.server.fileLogLevel, config.network.name)

blockchainManager = new BlockchainManager(config)
p2p = new P2PInterface(config)

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

DB
  .create(config.server.db)
  .then((db) => blockchainManager.attachDBInterface(db))
  .then(() => logger.info('Database started'))
  .then(() => p2p.warmup())
  .then(() => logger.info('Network interface started'))
  .then(() => blockchainManager.attachNetworkInterface(p2p).init())
  .then(lastBlock => logger.info('Blockchain connnected, local lastBlock', (lastBlock.data || {height: 0}).height))
  // .then(() => blockchainManager.syncWithNetwork())
  .then(() => new PublicAPI(config).start())
  .catch(fatal => logger.error('fatal error', fatal))
