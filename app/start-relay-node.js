const commander = require('commander')
const packageJson = require('../package.json')
const logger = require('app/core/logger')
const config = require('app/core/config')
const BlockchainManager = require('app/core/managers/blockchain')
const P2PInterface = require('app/api/p2p/p2pinterface')
const DB = require('app/core/dbinterface')
const WebhookManager = require('app/core/managers/webhook')
const QueueManager = require('app/core/managers/queue')
const DependencyHandler = require('app/core/dependency-handler')
const PublicAPI = require('app/api/public')
const TransactionPool = require('app/core/transaction-pool')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => {
  logger.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${reason}`)
})

async function init () {
  try {
    await config.init(commander.config)

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

    logger.info('Initialising Transaction Pool...')
    const txPool = await new TransactionPool(config)
    await blockchainManager.attachTransactionPool(txPool)

    logger.info('Initialising Blockchain Manager...')
    await blockchainManager.start()
    await blockchainManager.isReady()

    logger.info('Initialising Public API...')
    await PublicAPI(config)
  } catch (error) {
    logger.error('Fatal Error', error.stack)
    process.exit(1)
  }
}

init()
