const controller = require('../controllers/signatures')

class SignaturesRouter {
    register(registrar) {
        registrar.get('signatures', controller.index)
        registrar.get('signatures/fee', controller.fee)
    }
}

module.exports = new SignaturesRouter
