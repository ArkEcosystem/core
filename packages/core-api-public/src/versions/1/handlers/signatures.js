const blockchain = require('../../../../../core/src/managers/blockchain').getInstance()
const state = blockchain.getState()
const config = require('@arkecosystem/core-module-loader').get('config')
const utils = require('../utils')

exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(state.lastBlock.data.height).fees.secondsignature
    })
  }
}
