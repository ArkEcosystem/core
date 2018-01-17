const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const Controller = require('./controller')

class BlockchainController extends Controller {
  index (req, res, next) {
    super.init(req, res, next).then(() => {
      super.respondWith('ok', {
        data: config.getConstants(blockchain.getInstance().status.lastBlock.data.height)
      })
    })
  }

  fees (req, res, next) {
    super.init(req, res, next).then(() => {
      super.respondWith('ok', {
        data: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees.send
      })
    })
  }
}

module.exports = new BlockchainController()
