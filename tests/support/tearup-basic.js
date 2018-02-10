const path = require('path')
const config = require('app/core/config')
const goofy = require('app/core/goofy')

const BlockchainManager = require('app/core/managers/blockchain')
const P2PInterface = require('app/api/p2p/p2pinterface')
const DB = require('app/core/dbinterface')
const DependencyHandler = require('app/core/dependency-handler')
const PublicAPI = require('app/api/public')

const conf = 'config/devnet/'

let blockchainManager = null
let p2p = null

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

module.exports = async function () {
  await config.init({
    api: {
      p2p: require(path.resolve(conf, 'api/p2p')),
      public: require(path.resolve(conf, 'api/public'))
    },
    server: require(path.resolve(conf, 'server')),
    genesisBlock: require(path.resolve(conf, 'genesisBlock.json')),
    network: require(path.resolve(conf, 'network')),
    delegates: require(path.resolve(conf, 'delegate'))
  })
}
