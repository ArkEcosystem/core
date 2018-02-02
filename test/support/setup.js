const chai = require('chai')
const sinonChai = require('sinon-chai')
const chaiHttp = require('chai-http')
const path = require('path')
const config = require('../../core/config')
const goofy = require('../../core/goofy')

const BlockchainManager = require('../../core/blockchainManager')
const P2PInterface = require('../../api/p2p/p2pinterface')
const ForgerManager = require('../../core/forgerManager')
const DB = require('../../core/dbinterface')
const DependencyHandler = require('../../core/dependency-handler')
const PublicAPI = require('../../api/public')

// Chai config
chai.should()

// Chai plugins
chai.use(sinonChai)
chai.use(chaiHttp)

const conf = 'config/devnet/'

let blockchainManager = null
let p2p = null
let forgerManager = null
let forgers = null

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// Init TestNet Relay node
config.init({
  server: require(path.resolve(conf, 'server.json')),
  genesisBlock: require(path.resolve(conf, 'genesisBlock.json')),
  network: require(path.resolve(conf, 'network.json')),
  delegates: require(path.resolve(conf, 'delegate.json'))
})
.then(() => goofy.init(config.server.fileLogLevel, config.network.name + '-testRun'))
.then(() => (blockchainManager = new BlockchainManager(config)))
.then(() => (p2p = new P2PInterface(config)))
.then(() => DependencyHandler.checkDatabaseLibraries(config))
// .then(() => new Queue(config.server.redis))
// .then(() => new Cache(config.server.redis))
.then(() => DB.create(config.server.db))
.then(db => blockchainManager.attachDBInterface(db))
.then(() => goofy.info('Database started'))
.then(() => p2p.warmup())
.then(() => goofy.info('Network interface started'))
.then(() => blockchainManager.attachNetworkInterface(p2p).init())
.then(lastBlock => goofy.info('Blockchain connnected, local lastBlock', (lastBlock.data || { height: 0 }).height))
.then(() => blockchainManager.start())
.then(() => goofy.info('Mounting Public API'))
.then(() => new PublicAPI(config).mount())
//.then(() => (forgerManager = new ForgerManager(config)))
//.then(() => (forgers = forgerManager.loadDelegates()))
//.then(() => goofy.info('ForgerManager started with', forgers.length, 'forgers'))
//.then(() => forgerManager.startForging('http://127.0.0.1:4000'))
.catch((fatal) => goofy.error('fatal error', fatal))
