const config = require('@arkecosystem/core-plugin-manager').get('config')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')

const BlockchainManager = require('../../src/managers/blockchain')
const QueueManager = require('../../src/managers/queue')
const WebhookManager = require('../../src/managers/webhook')
const P2PInterface = require('../../src/api/p2p/p2pinterface')
const DB = require('../../src/dbinterface')
const DependencyHandler = require('../../src/dependency-handler')
const TransactionPool = require('../../src/transaction-pool')
const PublicAPI = require('../../src/api/public')

module.exports = async function () {
  try {
    await config.init('config/devnet')
    await logger.init(config.server.logging, config.network.name)

    const blockchainManager = await new BlockchainManager(config)

    logger.info('Starting Dependencies...')
    await DependencyHandler.checkDatabaseLibraries(config)

    logger.info('Starting Queue Manager...')
    await new QueueManager(config.server.redis)

    logger.info('Starting Webhook Manager...')
    await new WebhookManager(config.webhooks).init()

    logger.info('Starting Database Interface...')
    const db = await DB.create(config.server.database)
    await blockchainManager.attachDatabaseInterface(db)

    logger.info('Starting P2P Interface...')
    const p2p = new P2PInterface(config)
    await p2p.warmup()
    await blockchainManager.attachNetworkInterface(p2p)

    logger.info('Starting Transaction Pool...')
    const txPool = await new TransactionPool(config)
    await blockchainManager.attachTransactionPool(txPool)

    logger.info('Starting Blockchain Manager...')
    await blockchainManager.start()
    await blockchainManager.isReady()

    logger.info('Starting Public API...')
    await PublicAPI(config)
  } catch (error) {
    logger.error(error)
  }
}
