const path = require('path')
const config = require('app/core/config')
const goofy = require('app/core/goofy')

const conf = 'config/devnet/'

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
    genesisBlock: require(path.resolve(conf, 'genesis-block.json')),
    network: require(path.resolve(conf, 'network')),
    delegates: require(path.resolve(conf, 'delegate'))
  })
}
