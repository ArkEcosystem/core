const blockchain = require('app/core/blockchainManager').getInstance()
const state = blockchain.getState()
const config = require('app/core/config')
const utils = require('../utils')

exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(state.lastBlock.data.height).fees.secondsignature
    })
  }
}
