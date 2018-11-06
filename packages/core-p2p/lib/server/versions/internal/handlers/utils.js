'use strict'

const container = require('@arkecosystem/core-container')
const emitter = container.resolvePlugin('event-emitter')

const schema = require('../schemas/utils')

/**
 * @type {Object}
 */
exports.usernames = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const blockchain = container.resolvePlugin('blockchain')
    const walletManager = container.resolvePlugin('database').walletManager

    const lastBlock = blockchain.getLastBlock()
    const delegates = await blockchain.database.getActiveDelegates(lastBlock ? lastBlock.data.height + 1 : 1)

    const data = {}
    for (const delegate of delegates) {
      data[delegate.publicKey] = walletManager.findByPublicKey(delegate.publicKey).username
    }

    return { data }
  }
}

/**
* Emit the given event and payload to the local host.
 * @type {Object}
 */
exports.emitEvent = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    emitter.emit(request.payload.event, request.payload.body)

    return h.response(null).code(204)
  },
  options: {
    validate: schema.emitEvent
  }
}
