'use strict';

const pluginManager = require('@arkecosystem/core-plugin-manager')
const blockchainManager = pluginManager.get('blockchain')
const config = pluginManager.get('config')

/**
 * @type {Object}
 */
exports.status = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
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
 * @type {Object}
 */
exports.syncing = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
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
 * @type {Object}
 */
exports.configuration = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
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
