const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const helpers = require('../helpers')

class SignaturesController {
  fee (req, res, next) {
    helpers.respondWith('ok', {
      fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.secondsignature
    })
  }
}

module.exports = new SignaturesController()
