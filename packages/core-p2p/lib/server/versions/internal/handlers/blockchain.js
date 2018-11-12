const container = require('@arkecosystem/core-container')

const logger = container.resolvePlugin('logger')

/**
 * @type {Object}
 */
exports.sync = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    logger.debug('Blockchain sync check WAKEUP requested by forger :bed:')

    container.resolvePlugin('blockchain').forceWakeup()

    return h.response(null).code(204)
  },
}
