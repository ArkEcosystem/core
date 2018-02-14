const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('../package.json')
const path = require('path')
const goofy = require('app/core/goofy')
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

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))) {
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

async function boot () {
  try {
    await config.init({
      api: {
        p2p: require(path.resolve(commander.config, 'api/p2p')),
        public: require(path.resolve(commander.config, 'api/public'))
      },
      webhooks: require(path.resolve(commander.config, 'webhooks')),
      server: require(path.resolve(commander.config, 'server')),
      genesisBlock: require(path.resolve(commander.config, 'genesis-block.json')),
      network: require(path.resolve(commander.config, 'network'))
    })

    await goofy.init(config.server.logging.console, config.server.logging.file, config.network.name)
    const blockchainManager = await new BlockchainManager(config)

    goofy.info('Mounting Dependencies...')
    await DependencyHandler.checkDatabaseLibraries(config)

    goofy.info('Mounting Queue Manager...')
    await new QueueManager(config.server.queue)

    goofy.info('Mounting Webhook Manager...')
    await new WebhookManager(config.webhooks).mount()

    goofy.info('Mounting Database Interface...')
    const db = await DB.create(config.server.db)
    await blockchainManager.attachDBInterface(db)

    goofy.info('Mounting P2P Interface...')
    const p2p = await new P2PInterface(config)
    await p2p.warmup()
    await blockchainManager.attachNetworkInterface(p2p)

    goofy.info('Mounting Blockchain Manager...')
    await blockchainManager.start()
    await blockchainManager.isReady()

    goofy.info('Mounting Public API...')
    await PublicAPI(config)
  } catch (error) {
    goofy.error('fatal error', error)
  }
}

boot()
