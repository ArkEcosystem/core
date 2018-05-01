'use strict'

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const blockchain = pluginManager.get('blockchain')
const state = blockchain.getState()
const utils = require('../utils')

/**
 * @type {Object}
 */
exports.status = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    return utils.respondWith({
      loaded: blockchain.isSynced(),
      now: state.lastBlock ? state.lastBlock.data.height : 0,
      blocksCount: blockchain.getNetworkInterface().getNetworkHeight() - state.lastBlock.data.height
    })
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
  handler: (request, h) => {
    return utils.respondWith({
      syncing: !blockchain.isSynced(),
      blocks: blockchain.getNetworkInterface().getNetworkHeight() - state.lastBlock.data.height,
      height: state.lastBlock.data.height,
      id: state.lastBlock.data.id
    })
  }
}

/**
 * @type {Object}
 */
exports.autoconfigure = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
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
