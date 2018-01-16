const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const responder = requireFrom('api/responder')

class BlockchainController {
  index (req, res, next) {
    responder.ok(req, res, {
      data: config.getConstants(blockchain.getInstance().status.lastBlock.data.height)
    })

    next()
  }

  fees (req, res, next) {
    responder.ok(req, res, {
      data: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees.send
    })

    next()
  }
}

module.exports = new BlockchainController()
