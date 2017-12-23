const controller = require('../controllers/blockchain')

class BlockchainRouter {
    register(registrar) {
        registrar.get('blockchain', controller.index)
    }
}

module.exports = new BlockchainRouter
