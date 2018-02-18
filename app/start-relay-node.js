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

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => logger.error(`Unhandled Rejection at: ${p} reason: ${reason}`))

async function init () {
  try {
    await config.init(commander.config)

    await logger.init(config.server.logging, config.network.name)
    const blockchainManager = await new BlockchainManager(config)

    logger.info('Mounting Dependencies...')
    await DependencyHandler.checkDatabaseLibraries(config)

    logger.info('Mounting Queue Manager...')
    await new QueueManager(config.server.queue)

    logger.info('Mounting Webhook Manager...')
    await new WebhookManager(config.webhooks).init()

    logger.info('Mounting Database Interface...')
    const db = await DB.create(config.server.db)
    await blockchainManager.attachDBInterface(db)

    logger.info('Mounting P2P Interface...')
    const p2p = await new P2PInterface(config)
    await p2p.warmup()
    await blockchainManager.attachNetworkInterface(p2p)

    logger.info('Mounting Blockchain Manager...')
    await blockchainManager.start()
    await blockchainManager.isReady()

    logger.info('Mounting Public API...')
    await PublicAPI(config)
  } catch (error) {
    logger.error('Fatal Error - Exiting...')
    process.exit(1)
  }
}

init()
