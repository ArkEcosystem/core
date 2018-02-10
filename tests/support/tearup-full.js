const path = require('path')
const config = require('app/core/config')
const goofy = require('app/core/goofy')

const BlockchainManager = require('app/core/managers/blockchain')
const P2PInterface = require('app/api/p2p/p2pinterface')
const DB = require('app/core/dbinterface')
const DependencyHandler = require('app/core/dependency-handler')
const PublicAPI = require('app/api/public')

const conf = 'config/devnet/'

let blockchainManager = null
let p2p = null

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

module.exports = async function () {
  await config.init({
    api: {
      p2p: require(path.resolve(conf, 'api/p2p')),
      public: require(path.resolve(conf, 'api/public'))
    },
    server: require(path.resolve(conf, 'server')),
    genesisBlock: require(path.resolve(conf, 'genesisBlock.json')),
    network: require(path.resolve(conf, 'network')),
    delegates: require(path.resolve(conf, 'delegate'))
  })
  .then(() => goofy.init(config.server.logging.console, config.server.logging.file, config.network.name))
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
  .then(() => blockchainManager.isReady())
  .then(() => goofy.info('Mounting Public API'))
  .then(() => PublicAPI(config))
  .catch(fatal => goofy.error('fatal error', fatal))
}
