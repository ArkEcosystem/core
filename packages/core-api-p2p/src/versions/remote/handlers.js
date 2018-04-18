'use strict';

const blockchainManager = require('@arkecosystem/core-plugin-manager').get('blockchain')

/**
 * [sendBlockchainEvent description]
 * @type {Object}
 */
exports.sendBlockchainEvent = {
  handler: (request, h) => {
    const bm = blockchainManager

    if (!bm[request.params.event]) {
      return h.response({
        success: false,
        event: request.params.event,
        message: 'No such event'
      }).code(500)
    }

    const event = bm[request.params.event]

    request.query.param
      ? event(request.query.paramrequest.params.param)
      : event()

    return {
      success: true,
      event: request.params.event
    }
  }
}
