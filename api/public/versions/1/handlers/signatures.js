const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.secondsignature
    })
  }
}
