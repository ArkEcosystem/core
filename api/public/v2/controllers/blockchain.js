const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const helpers = require('../helpers')

class BlockchainController {
  index (req, res, next) {
    helpers.respondWith('ok', config.getConstants(blockchain.status.lastBlock.data.height))
  }
}

module.exports = new BlockchainController()
