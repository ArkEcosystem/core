'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const blockchain = container.resolvePlugin('blockchain')
const utils = require('../utils')
const { transactions } = require('../../../repositories')

/**
 * @type {Object}
 */
exports.status = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    const lastBlock = blockchain.getLastBlock()

    return utils.respondWith({
      loaded: blockchain.isSynced(),
      now: lastBlock ? lastBlock.data.height : 0,
      blocksCount: blockchain.p2p.getNetworkHeight() - lastBlock ? lastBlock.data.height : 0
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
  handler (request, h) {
    const lastBlock = blockchain.getLastBlock()

    return utils.respondWith({
      syncing: !blockchain.isSynced(),
      blocks: blockchain.p2p.getNetworkHeight() - lastBlock.data.height,
      height: lastBlock.data.height,
      id: lastBlock.data.id
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
  async handler (request, h) {
    const feeStatisticsData = await transactions.getFeeStatistics()

    return utils.respondWith({
      network: {
        nethash: config.network.nethash,
        token: config.network.client.token,
        symbol: config.network.client.symbol,
        explorer: config.network.client.explorer,
        version: config.network.pubKeyHash,
        ports: utils.toResource(request, config, 'ports'),
        feeStatistics: utils.toCollection(request, feeStatisticsData, 'fee-statistics')
      }
    })
  }
}
