const commander = require('commander')
const packageJson = require('../package.json')
const logger = require('app/core/logger')
const config = require('app/core/config')
const BlockchainManager = require('app/core/managers/blockchain')
const P2PInterface = require('app/api/p2p/p2pinterface')
const DB = require('app/core/dbinterface')
const QueueManager = require('app/core/managers/queue')
const WebhookManager = require('app/core/managers/webhook')
const DependencyHandler = require('app/core/dependency-handler')
const PublicAPI = require('app/api/public')
const TransactionPool = require('app/core/transaction-pool')
const ForgerManager = require('app/core/managers/forger')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-b, --bip38 <bip38>', 'forger bip38')
  .option('-a, --address <address>', 'forger address')
  .option('-p, --password <password>', 'forger password')
  .option('-i, --interactive', 'launch cli')
  .option('--network-start', 'force genesis network start')
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => logger.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${reason}`))

const start = async () => {
  try {
    await config.init(commander.config)
    await logger.init(config.server.logging, config.network.name)

    const blockchainManager = await new BlockchainManager(config, commander.networkStart)

    logger.info('Initialising Dependencies...')
    await DependencyHandler.checkDatabaseLibraries(config)

    logger.info('Initialising Queue Manager...')
    await new QueueManager(config.server.queue)

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

    logger.info('Starting Forger...')
    const forgerManager = await new ForgerManager(config)
    const forgers = await forgerManager.loadDelegates(commander.bip38, commander.address, commander.password)

    logger.info('ForgerManager started with', forgers.length, 'forgers')
    forgerManager.startForging(`http://127.0.0.1:${config.server.port}`)
  } catch (error) {
    console.error(error.stack)
    process.exit(1)
  }
}

start()
