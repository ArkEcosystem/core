'use strict';

const pluginManager = require('@arkecosystem/core-plugin-manager')
const blockchainManager = pluginManager.get('blockchain')
const config = pluginManager.get('config')

/**
 * [status description]
 * @type {Object}
 */
exports.status = {
  handler: async (request, h) => {
    const lastBlock = blockchainManager.getState().lastBlock
    const networkHeight = await blockchainManager.getNetworkInterface().getNetworkHeight()

    return {
      data: {
        synced: blockchainManager.isSynced(),
        now: lastBlock ? lastBlock.data.height : 0,
        blocksCount: networkHeight - lastBlock.data.height || 0
      }
    }
  }
}

/**
 * [syncing description]
 * @type {Object}
 */
exports.syncing = {
  handler: async (request, h) => {
    const lastBlock = blockchainManager.getState().lastBlock
    const networkHeight = await blockchainManager.getNetworkInterface().getNetworkHeight()

    return {
      data: {
        syncing: !blockchainManager.isSynced(),
        blocks: networkHeight - lastBlock.data.height || 0,
        height: lastBlock.data.height,
        id: lastBlock.data.id
      }
    }
  }
}

/**
 * [configuration description]
 * @type {Object}
 */
exports.configuration = {
  handler: (request, h) => {
    return {
      data: {
        nethash: config.network.nethash,
        token: config.network.client.token,
        symbol: config.network.client.symbol,
        explorer: config.network.client.explorer,
        version: config.network.pubKeyHash,
        constants: config.getConstants(blockchainManager.getState().lastBlock.data.height)
      }
    }
  }
}
