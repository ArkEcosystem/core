const config = require('app/core/config')
const logger = require('app/core/logger')

const BlockchainManager = require('app/core/managers/blockchain')
const WebhookManager = require('app/core/managers/webhook')
const QueueManager = require('app/core/managers/queue')
const P2PInterface = require('app/api/p2p/p2pinterface')
const DB = require('app/core/dbinterface')
const DependencyHandler = require('app/core/dependency-handler')
const PublicAPI = require('app/api/public')

module.exports = async function () {
  try {
    await config.init('config/devnet')

    await logger.init(config.server.logging, config.network.name)
    const blockchainManager = await new BlockchainManager(config)

    logger.info('Initialising Dependencies...')
    await DependencyHandler.checkDatabaseLibraries(config)

    logger.info('Initialising Queue Manager...')
    await new QueueManager(config.server.queue)

    logger.info('Initialising Webhook Manager...')
    await new WebhookManager(config.webhooks).init()

    logger.info('Initialising Database Interface...')
    const db = await DB.create(config.server.db)
    await blockchainManager.attachDBInterface(db)

    logger.info('Initialising P2P Interface...')
    const p2p = await new P2PInterface(config)
    await p2p.warmup()
    await blockchainManager.attachNetworkInterface(p2p)

    logger.info('Initialising Blockchain Manager...')
    await blockchainManager.start()
    await blockchainManager.isReady()

    logger.info('Initialising Public API...')
    await PublicAPI(config)
  } catch (error) {
    logger.error(error.stack)
  }
}
