'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const transform = require('./transformers/plugins')

/**
 * @type {Object}
 */
exports.getConfig = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    return {
      data: {
        nethash: config.network.nethash,
        token: config.network.client.token,
        symbol: config.network.client.symbol,
        explorer: config.network.client.explorer,
        versions: {
          network: config.network.pubKeyHash,
          core: container.resolveOptions('blockchain').version
        },
        plugins: transform(config)
      }
    }
  }
}
