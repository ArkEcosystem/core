const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const helpers = require('../helpers')

class LoaderController {
  status (req, res, next) {
    const instance = blockchain.getInstance()

    helpers.respondWith('ok', {
      loaded: instance.isSynced(instance.lastBlock),
      now: instance.lastBlock ? instance.lastBlock.data.height : 0,
      blocksCount: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height
    })
  }

  syncing (req, res, next) {
    const instance = blockchain.getInstance()

    helpers.respondWith('ok', {
      syncing: !instance.isSynced(instance.lastBlock),
      blocks: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height,
      height: instance.lastBlock.data.height,
      id: instance.lastBlock.data.id
    })
  }

  configuration (req, res, next) {
    helpers.respondWith('ok', {
      nethash: config.network.nethash,
      token: config.network.client.token,
      symbol: config.network.client.symbol,
      explorer: config.network.client.explorer,
      version: config.network.pubKeyHash
    })
  }
}

module.exports = new LoaderController()
