const commander = require('commander')
const packageJson = require('../package.json')
const logger = require('./core/logger')
const config = require('./core/config')
const BlockchainManager = require('./core/managers/blockchain')
const P2PInterface = require('./api/p2p/p2pinterface')
const DB = require('./core/dbinterface')
const QueueManager = require('./core/managers/queue')
const WebhookManager = require('./core/managers/webhook')
const DependencyHandler = require('./core/dependency-handler')
const PublicAPI = require('./api/public')
const TransactionPool = require('./core/transaction-pool')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => console.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${reason}`))

const start = async () => {
  try {
    await config.init(commander.config)
    await logger.init(config.server.logging, config.network.name)

    const blockchainManager = await new BlockchainManager(config)

    logger.info('Initialising Dependencies...')
    await DependencyHandler.checkDatabaseLibraries(config)

    logger.info('Initialising Queue Manager...')
    await new QueueManager(config.server.redis)

    logger.info('Initialising Webhook Manager...')
    await new WebhookManager(config.webhooks).init()

    logger.info('Initialising Database Interface...')
    const db = await DB.create(config.server.database)
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
    console.error(error.stack)
    process.exit(1)
  }
}

start()
