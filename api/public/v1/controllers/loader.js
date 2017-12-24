const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const p2pInterface = require(__root + 'api/p2p/p2pinterface')
const responder = require(__root + 'api/responder')

class LoaderController {
  status(req, res, next) {
    const instance = blockchain.getInstance()

    responder.ok(req, res, {
      loaded: instance.isSynced(instance.lastBlock),
      now: instance.lastBlock ? instance.lastBlock.data.height : 0,
      blocksCount: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height
    })

    next()
  }

  syncing(req, res, next) {
    const instance = blockchain.getInstance()

    responder.ok(req, res, {
      syncing: !instance.isSynced(instance.lastBlock),
      blocks: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height,
      height: instance.lastBlock.data.height,
      id: instance.lastBlock.data.id
    })

    next()
  }

  autoconfigure(req, res, next) {
    responder.ok(req, res, {
      network: {
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

module.exports = new LoaderController
