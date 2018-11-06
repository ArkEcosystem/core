'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const transform = require('../transformers/plugins')

/**
 * @type {Object}
 */
exports.config = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    return {
      data: {
        version: container.resolveOptions('blockchain').version,
        network: {
          version: config.network.pubKeyHash,
          nethash: config.network.nethash,
          explorer: config.network.client.explorer,
          token: {
            name: config.network.client.token,
            symbol: config.network.client.symbol
          }
        },
        plugins: transform(config)
      }
    }
  },
  config: {
    cors: true
  }
}
