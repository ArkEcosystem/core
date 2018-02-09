const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('../package.json')
const path = require('path')
const goofy = require('app/core/goofy')
const BlockchainManager = require('app/core/blockchainManager')
const P2PInterface = require('app/api/p2p/p2pinterface')
const DB = require('app/core/dbinterface')
const Cache = require('app/core/cache')
const Queue = require('app/core/queue')
const DependencyHandler = require('app/core/dependency-handler')
const WebhookListener = require('app/core/webhooks/listener')
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

const config = require('app/core/config')
let blockchainManager = null
let p2p = null

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

config.init({
  api: {
    p2p: require(path.resolve(commander.config, 'api/p2p')),
    public: require(path.resolve(commander.config, 'api/public'))
  },
  webhooks: require(path.resolve(commander.config, 'webhooks')),
  server: require(path.resolve(commander.config, 'server')),
  genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
  network: require(path.resolve(commander.config, 'network'))
})
.then(() => goofy.init(config.server.logging.console, config.server.logging.file, config.network.name))
.then(() => (blockchainManager = new BlockchainManager(config)))
.then(() => (p2p = new P2PInterface(config)))
.then(() => DependencyHandler.checkDatabaseLibraries(config))
.then(() => DB.create(config.server.db))
.then(db => blockchainManager.attachDBInterface(db))
.then(() => goofy.info('Database started'))
.then(() => p2p.warmup())
.then(() => goofy.info('Network interface started'))
.then(() => blockchainManager.attachNetworkInterface(p2p))
.then(() => blockchainManager.start())
.then(() => blockchainManager.isReady())
.then(() => goofy.info('Mounting Webhook Listener'))
.then(() => new WebhookListener().subscribe())
.then(() => goofy.info('Mounting Public API'))
.then(() => PublicAPI(config))
.catch(fatal => goofy.error('fatal error', fatal))
