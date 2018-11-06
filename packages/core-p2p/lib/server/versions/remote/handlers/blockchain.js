'use strict'

const container = require('@arkecosystem/core-container')
const schema = require('../schemas/blockchain')

/**
 * Respond with a blockchain event.
 * @type {Object}
 */
exports.emitEvent = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    const event = container.resolvePlugin('blockchain').events[request.params.event]

    request.query.param
      ? event(request.query.params)
      : event()

    return h.response(null).code(204)
  },
  options: {
    validate: schema.emitEvent
  }
}
