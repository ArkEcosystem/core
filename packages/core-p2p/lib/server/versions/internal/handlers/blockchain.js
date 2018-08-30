'use strict'

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

/**
 * @type {Object}
 */
exports.getNetworkState = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    try {
      return {
        success: true,
        networkState: await container.resolvePlugin('blockchain').p2p.getNetworkState()
      }
    } catch (error) {
      return h.response({
        success: false,
        message: error.message
      }).code(500).takeover()
    }
  }
}

/**
 * @type {Object}
 */
exports.checkBlockchainSynced = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    try {
      logger.debug('Blockchain sync check WAKEUP requested by forger :bed:')
      container.resolvePlugin('blockchain').dispatch('WAKEUP')

      return {
        success: true
      }
    } catch (error) {
      return h.response({
        success: false,
        message: error.message
      }).code(500).takeover()
    }
  }
}
