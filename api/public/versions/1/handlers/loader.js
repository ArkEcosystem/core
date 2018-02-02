const blockchain = require('core/blockchainManager').getInstance()
const config = require('core/config')
const utils = require('../utils')

exports.status = {
  handler: (request, h) => {
    return utils.respondWith({
      loaded: blockchain.isSynced(blockchain.lastBlock),
      now: blockchain.lastBlock ? blockchain.lastBlock.data.height : 0,
      blocksCount: blockchain.networkInterface.getNetworkHeight() - blockchain.lastBlock.data.height
    })
  }
}

exports.syncing = {
  handler: (request, h) => {
    return utils.respondWith({
      syncing: !blockchain.isSynced(blockchain.lastBlock),
      blocks: blockchain.networkInterface.getNetworkHeight() - blockchain.lastBlock.data.height,
      height: blockchain.lastBlock.data.height,
      id: blockchain.lastBlock.data.id
    })
  }
}

exports.autoconfigure = {
  handler: (request, h) => {
    return utils.respondWith({
      network: {
        nethash: config.network.nethash,
        token: config.network.client.token,
        symbol: config.network.client.symbol,
        explorer: config.network.client.explorer,
        version: config.network.pubKeyHash
      }
    })
  }
}
