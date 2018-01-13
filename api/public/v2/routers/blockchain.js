const controller = require('../controllers/blockchain')

class BlockchainRouter {
  register (registrar) {
    registrar.get('blockchain', controller.index)
    registrar.get('blockchain/fees', controller.fees)
  }
}

module.exports = new BlockchainRouter()
