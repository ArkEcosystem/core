const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const helpers = require('../helpers')

class BlockchainController {
  index (req, res, next) {
    helpers.respondWith('ok', config.getConstants(blockchain.getInstance().status.lastBlock.data.height))
  }

  fees (req, res, next) {
    helpers.respondWith('ok', config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees.send)
  }
}

module.exports = new BlockchainController()
