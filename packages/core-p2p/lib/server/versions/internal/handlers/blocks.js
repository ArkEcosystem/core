'use strict'

const container = require('@arkecosystem/core-container')
const requestIp = require('request-ip')

/**
 * @type {Object}
 */
exports.postInternalBlock = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    const block = request.payload
    block.ip = requestIp.getClientIp(request)
    container.resolvePlugin('blockchain').queueBlock(block)

    return { success: true }
  }
}
