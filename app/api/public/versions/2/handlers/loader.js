const blockchain = require('app/core/managers/blockchain').getInstance()
const state = blockchain.getState()
const config = require('app/core/config')

exports.status = {
  handler: (request, h) => {
    const lastBlock = state.lastBlock

    return blockchain.networkInterface.getNetworkHeight().then((networkHeight) => {
      return {
        data: {
          loaded: blockchain.isSynced(),
          now: lastBlock ? lastBlock.data.height : 0,
          blocksCount: networkHeight - lastBlock.data.height
        }
      }
    })
  }
}

exports.syncing = {
  handler: (request, h) => {
    const lastBlock = state.lastBlock

    return blockchain.networkInterface.getNetworkHeight().then((networkHeight) => {
      return {
        data: {
          syncing: !blockchain.isSynced(),
          blocks: networkHeight - lastBlock.data.height,
          height: lastBlock.data.height,
          id: lastBlock.data.id
        }
      }
    })
  }
}

exports.configuration = {
  handler: (request, h) => {
    return {
      data: {
        nethash: config.network.nethash,
        token: config.network.client.token,
        symbol: config.network.client.symbol,
        explorer: config.network.client.explorer,
        version: config.network.pubKeyHash
      }
    }
  }
}
