const blockchain = require('app/core/blockchainManager').getInstance()
const config = require('app/core/config')
const utils = require('../utils')

exports.status = {
  handler: (request, h) => {
    return utils.respondWith({
      loaded: blockchain.isSynced(),
      now: blockchain.state.lastBlock ? blockchain.state.lastBlock.data.height : 0,
      blocksCount: blockchain.networkInterface.getNetworkHeight() - blockchain.state.lastBlock.data.height
    })
  }
}

exports.syncing = {
  handler: (request, h) => {
    return utils.respondWith({
      syncing: !blockchain.isSynced(),
      blocks: blockchain.networkInterface.getNetworkHeight() - blockchain.state.lastBlock.data.height,
      height: blockchain.state.lastBlock.data.height,
      id: blockchain.state.lastBlock.data.id
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
