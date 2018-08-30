'use strict'

const container = require('@arkecosystem/core-container')
const { slots } = require('@arkecosystem/crypto')
const schema = require('./schema')

/**
 * @type {Object}
 */
exports.height = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    const lastBlock = container.resolvePlugin('blockchain').getLastBlock()

    return {
      success: true,
      height: lastBlock.data.height,
      id: lastBlock.data.id
    }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getHeight
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.status = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    const lastBlock = container.resolvePlugin('blockchain').getLastBlock()

    return {
      success: true,
      height: lastBlock.data.height,
      forgingAllowed: slots.isForgingAllowed(),
      currentSlot: slots.getSlotNumber(),
      header: lastBlock.getHeader()
    }
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getStatus
      }
    }
  }
}
