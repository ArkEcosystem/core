// loader.js
const blockchain = require('../../../core/blockchainManager')
const p2pInterface = require('../../p2p/p2pinterface')
const config = require('../../../core/config')

class LoaderController {
  constructor (serverRestify) {
    this.server = serverRestify
  }

  initRoutes (pathPrefix) {
    this.server.get({path: pathPrefix + '/autoconfigure', version: '1.0.0'}, this.getAutoConfigure)
    this.server.get({path: pathPrefix + '/status', version: '1.0.0'}, this.getLoaderStatus)
  }

  getAutoConfigure (req, res, next) {
    res.send(200, {
      success: true,
      network: config.network,
      meta: {
        requestedVersion: req.version(),
        matchedVersion: req.matchedVersion()
      }
    })
    next()
  }

  getLoaderStatus (req, res, next) {
    // TODO finish
    res.send(200, {
      success: true,
      loaded: blockchain.getInstance().isSynced(blockchain.getInstance().lastBlock),
      now: blockchain.getInstance().lastBlock ? blockchain.getInstance().lastBlock.data.height : 0,
      blocksCount: blockchain.getInstance().networkInterface.getNetworkHeight() - blockchain.getInstance().lastBlock.data.height,
      meta: {
        requestedVersion: req.version(),
        matchedVersion: req.matchedVersion()
      }
    })
    next()
  }
}

module.exports = LoaderController
