const container = require('@arkecosystem/core-container')
const { slots } = require('@arkecosystem/crypto')

/**
 * @type {Object}
 */
exports.height = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    const lastBlock = container.resolvePlugin('blockchain').getLastBlock()

    return {
      data: {
        id: lastBlock.data.id,
        height: lastBlock.data.height,
      },
    }
  },
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
  handler(request, h) {
    const lastBlock = container.resolvePlugin('blockchain').getLastBlock()

    return {
      data: {
        height: lastBlock.data.height,
        forgingAllowed: slots.isForgingAllowed(),
        currentSlot: slots.getSlotNumber(),
        header: lastBlock.getHeader(),
      },
    }
  },
}
