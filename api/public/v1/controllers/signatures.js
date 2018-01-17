const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const helpers = require('../helpers')

class SignaturesController {
  fee (req, res, next) {
    helpers.respondWith('ok', {
      fee: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees.secondsignature
    })
  }
}

module.exports = new SignaturesController()
