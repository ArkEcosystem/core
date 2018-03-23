const config = require('../../app/core/config')
const logger = require('../../app/core/logger')

const BlockchainManager = require('../../app/core/managers/blockchain')
const P2PInterface = require('../../app/api/p2p/p2pinterface')
const DB = require('../../app/core/dbinterface')
const DependencyHandler = require('../../app/core/dependency-handler')
const PublicAPI = require('../../app/api/public')

module.exports = async function () {
  try {
    await config.init('config/devnet')

    logger.init(config.server.logging, config.network.name)

    const blockchainManager = await new BlockchainManager(config)
    const p2p = await new P2PInterface(config)

    await DependencyHandler.checkDatabaseLibraries(config)

    const db = await DB.create(config.server.database)
    await blockchainManager.attachDBInterface(db)
    await p2p.warmup()
    await blockchainManager.attachNetworkInterface(p2p)
    await blockchainManager.start()
    await blockchainManager.isReady()

    logger.info('Initialising Public API')
    await PublicAPI(config)
  } catch (error) {
    logger.error(error)
  }
}
