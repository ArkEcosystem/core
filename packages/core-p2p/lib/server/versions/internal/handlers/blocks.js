const container = require('@arkecosystem/core-container')
const requestIp = require('request-ip')
const schema = require('../schemas/blocks')

/**
 * @type {Object}
 */
exports.store = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    request.payload.block.ip = requestIp.getClientIp(request)

    container.resolvePlugin('blockchain').queueBlock(request.payload.block)

    return h.response(null).code(204)
  },
  options: {
    validate: schema.store,
  },
}
