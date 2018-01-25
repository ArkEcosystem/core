const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

class BlockchainController {
  index (req, res, next) {
    utils.respondWith('ok', config.getConstants(blockchain.status.lastBlock.data.height))
  }
}

module.exports = new BlockchainController()
