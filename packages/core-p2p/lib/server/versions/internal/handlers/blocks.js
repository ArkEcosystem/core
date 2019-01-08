const app = require('@arkecosystem/core-container')
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
    request.payload.block.ip = request.info.remoteAddress

    app.resolvePlugin('blockchain').queueBlock(request.payload.block)

    return h.response(null).code(204)
  },
  options: {
    validate: schema.store,
  },
}
