'use strict'

const container = require('@arkecosystem/core-container')

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
    const blockchain = container.resolvePlugin('blockchain')

    if (!blockchain[request.params.event]) {
      return h.response('No such event').code(500)
    }

    const event = blockchain[request.params.event]

    request.query.param
      ? event(request.query.paramrequest.params.param)
      : event()

    return {
      event: request.params.event
    }
  }
}
