'use strict';

const blockchain = require('@arkecosystem/core-plugin-manager').get('blockchain')
const state = blockchain.getState()
const config = require('@arkecosystem/core-plugin-manager').get('config')

exports.status = {
  handler: async (request, h) => {
    const lastBlock = state.lastBlock
    const networkHeight = await blockchain.networkInterface.getNetworkHeight()

    return {
      data: {
        synced: blockchain.isSynced(),
        now: lastBlock ? lastBlock.data.height : 0,
        blocksCount: networkHeight - lastBlock.data.height || 0
      }
    }
  }
}

exports.syncing = {
  handler: async (request, h) => {
    const lastBlock = state.lastBlock
    const networkHeight = await blockchain.networkInterface.getNetworkHeight()

    return {
      data: {
        syncing: !blockchain.isSynced(),
        blocks: networkHeight - lastBlock.data.height || 0,
        height: lastBlock.data.height,
        id: lastBlock.data.id
      }
    }
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
        version: config.network.pubKeyHash,
        constants: config.getConstants(blockchain.getState().lastBlock.data.height)
      }
    }
  }
}
