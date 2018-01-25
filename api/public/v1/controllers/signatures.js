const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

class SignaturesController {
  fee (req, res, next) {
    utils.respondWith('ok', {
      fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.secondsignature
    })
  }
}

module.exports = new SignaturesController()
