'use strict'

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const blockchain = pluginManager.get('blockchain')
const state = blockchain.getState()

const utils = require('../utils')

/**
 * @type {Object}
 */
exports.fee = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(state.lastBlock.data.height).fees.secondsignature
    })
  }
}
