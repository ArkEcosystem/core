// loader.js
const blockchain = require('../../../core/blockchainManager')
const p2pInterface = require('../../p2p/p2pinterface')
const config = require('../../../core/config')

class LoaderController {
  start (serverRestify) {
    this.server = serverRestify
    this.initRoutes()
  }

  initRoutes () {
    this.server.get({path: 'api/loader/autoconfigure', version: '1.0.0'}, this.getAutoConfigure)
    this.server.get({path: 'api/loader/status', version: '1.0.0'}, this.getLoaderStatus)
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
    p2pInterface.getInstance().getNetworkHeight().then(data => {
      res.send(200, {
        success: true,
        loaded: blockchain.getInstance().isSynced(blockchain.getInstance().lastBlock),
        now: blockchain.getInstance().lastBlock ? blockchain.getInstance().lastBlock.data.height : 0,
        blocksCount: 0,
        networkHeight: data,
        meta: {
          requestedVersion: req.version(),
          matchedVersion: req.matchedVersion()
        }
      })
      next()
    })
  }
}

module.exports = new LoaderController()
