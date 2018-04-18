'use strict';

const blockchain = require('@arkecosystem/core-plugin-manager').get('blockchain')

exports.sendBlockchainEvent = {
  handler: (request, h) => {
    const bm = blockchain.getInstance()

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
