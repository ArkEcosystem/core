const blockchain = require('@arkecosystem/core-pluggy').get('blockchain')
const state = blockchain.getState()
const config = require('@arkecosystem/core-pluggy').get('config')
const utils = require('../utils')

exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(state.lastBlock.data.height).fees.secondsignature
    })
  }
}
