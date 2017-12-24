const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const responder = require(__root + 'api/responder')

class BlockchainController {
  index(req, res, next) {
    responder.ok(req, res, {
      data: config.getConstants(blockchain.getInstance().lastBlock.data.height)
    })

    next()
  }
}

module.exports = new BlockchainController
