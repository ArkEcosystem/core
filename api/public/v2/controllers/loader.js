const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const Controller = require('./controller')

class LoaderController extends Controller {
  status (req, res, next) {
    super.init(req, res, next).then(() => {
      const instance = blockchain.getInstance()

      super.respondWith('ok', {
        data: {
          loaded: instance.isSynced(instance.lastBlock),
          now: instance.lastBlock ? instance.lastBlock.data.height : 0,
          blocksCount: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height
        }
      })
    })
  }

  syncing (req, res, next) {
    super.init(req, res, next).then(() => {
      const instance = blockchain.getInstance()

      super.respondWith('ok', {
        data: {
          syncing: !instance.isSynced(instance.lastBlock),
          blocks: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height,
          height: instance.lastBlock.data.height,
          id: instance.lastBlock.data.id
        }
      })
    })
  }

  configuration (req, res, next) {
    super.init(req, res, next).then(() => {
      super.respondWith('ok', {
        data: {
          nethash: config.network.nethash,
          token: config.network.client.token,
          symbol: config.network.client.symbol,
          explorer: config.network.client.explorer,
          version: config.network.pubKeyHash
        }
      })
    })
  }
}

module.exports = new LoaderController()
