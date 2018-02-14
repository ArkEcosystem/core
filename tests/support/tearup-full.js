const path = require('path')
const config = require('app/core/config')
const goofy = require('app/core/goofy')

const BlockchainManager = require('app/core/managers/blockchain')
const P2PInterface = require('app/api/p2p/p2pinterface')
const DB = require('app/core/dbinterface')
const DependencyHandler = require('app/core/dependency-handler')
const PublicAPI = require('app/api/public')

const conf = 'config/devnet/'

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

module.exports = async function () {
  try {
    await config.init({
      api: {
        p2p: require(path.resolve(conf, 'api/p2p')),
        public: require(path.resolve(conf, 'api/public'))
      },
      webhooks: require(path.resolve(conf, 'webhooks')),
      server: require(path.resolve(conf, 'server')),
      genesisBlock: require(path.resolve(conf, 'genesis-block.json')),
      network: require(path.resolve(conf, 'network')),
      delegates: require(path.resolve(conf, 'delegate'))
    })

    goofy.init(config.server.logging.console, config.server.logging.file, config.network.name)

    const blockchainManager = await new BlockchainManager(config)
    const p2p = await new P2PInterface(config)

    await DependencyHandler.checkDatabaseLibraries(config)

    const db = await DB.create(config.server.db)
    await blockchainManager.attachDBInterface(db)
    goofy.info('Database started')

    await p2p.warmup()
    goofy.info('Network interface started')

    await blockchainManager.attachNetworkInterface(p2p)
    await blockchainManager.start()
    await blockchainManager.isReady()

    goofy.info('Mounting Public API')
    await PublicAPI(config)
  } catch (error) {
    goofy.error('fatal error', error)
  }
}
