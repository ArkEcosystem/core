global.__root = __dirname + '/';

const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const config = require('./core/config')
const BlockchainManager = require('./core/blockchainManager')
const P2PInterface = require('./api/p2p/p2pinterface')
const DB = require('./core/dbinterface')

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

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

DB
  .create(config.server.db)
  .then((db) => db.snapshot(`${__dirname}/snapshot`))
  .then(() => logger.info('Snapshot saved'))
  .catch(fatal => logger.error('fatal error', fatal))
