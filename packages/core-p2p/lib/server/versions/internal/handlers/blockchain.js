'use strict'

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const monitor = require('../../../../monitor')

/**
 * @type {Object}
 */
exports.networkState = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    return {
      data: await monitor.getNetworkState()
    }
  }
}

/**
 * @type {Object}
 */
exports.synced = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    logger.debug('Blockchain sync check WAKEUP requested by forger :bed:')

    container.resolvePlugin('blockchain').dispatch('WAKEUP')

    return h.response(null).code(102)
  }
}
