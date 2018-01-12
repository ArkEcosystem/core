const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const responder = requireFrom('api/responder')

class LoaderController {
  status (req, res, next) {
    const instance = blockchain.getInstance()

    responder.ok(req, res, {
      data: {
        loaded: instance.isSynced(instance.lastBlock),
        now: instance.lastBlock ? instance.lastBlock.data.height : 0,
        blocksCount: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height
      }
    })

    next()
  }

  syncing (req, res, next) {
    const instance = blockchain.getInstance()

    responder.ok(req, res, {
      data: {
        syncing: !instance.isSynced(instance.lastBlock),
        blocks: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height,
        height: instance.lastBlock.data.height,
        id: instance.lastBlock.data.id
      }
    })

    next()
  }

  configuration (req, res, next) {
    responder.ok(req, res, {
      data: {
        nethash: config.network.nethash,
        token: config.network.client.token,
        symbol: config.network.client.symbol,
        explorer: config.network.client.explorer,
        version: config.network.pubKeyHash
      }
    })

    next()
  }
}

module.exports = new LoaderController()
