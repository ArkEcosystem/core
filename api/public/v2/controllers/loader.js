const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

class LoaderController {
  status (req, res, next) {
    const lastBlock = blockchain.status.lastBlock

    utils
      .respondWith('ok', {
        loaded: blockchain.isSynced(lastBlock),
        now: lastBlock ? lastBlock.data.height : 0,
        blocksCount: blockchain.networkInterface.getNetworkHeight() - lastBlock.data.height
      })
      .then(() => next())
  }

  syncing (req, res, next) {
    const lastBlock = blockchain.status.lastBlock

    utils
      .respondWith('ok', {
        syncing: !blockchain.isSynced(lastBlock),
        blocks: blockchain.networkInterface.getNetworkHeight() - lastBlock.data.height,
        height: lastBlock.data.height,
        id: lastBlock.data.id
      })
      .then(() => next())
  }

  configuration (req, res, next) {
    utils
      .respondWith('ok', {
        nethash: config.network.nethash,
        token: config.network.client.token,
        symbol: config.network.client.symbol,
        explorer: config.network.client.explorer,
        version: config.network.pubKeyHash
      })
      .then(() => next())
  }
}

module.exports = new LoaderController()
