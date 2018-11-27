const app = require('@arkecosystem/core-container')

const logger = app.resolvePlugin('logger')

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

    app.resolvePlugin('blockchain').forceWakeup()

    return h.response(null).code(204)
  },
}
