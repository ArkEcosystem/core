'use strict'

const container = require('@phantomcore/core-container')

/**
 * Respond with a blockchain event.
 * @type {Object}
 */
exports.sendBlockchainEvent = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    const blockchain = container.resolvePlugin('blockchain')

    if (!blockchain[request.params.event]) {
      return h.response({
        success: false,
        event: request.params.event,
        message: 'No such event'
      }).code(500)
    }

    const event = blockchain[request.params.event]

    request.query.param
      ? event(request.query.paramrequest.params.param)
      : event()

    return {
      success: true,
      event: request.params.event
    }
  }
}
