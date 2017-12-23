const controller = require('../controllers/multisignatures')

class MultiSignaturesRouter {
    register(registrar) {
        registrar.get('multisignatures', controller.index)
        registrar.post('multisignatures', controller.store)
        registrar.get('multisignatures/pending', controller.pending)
        registrar.get('multisignatures/accounts', controller.accounts)
    }
}

module.exports = new MultiSignaturesRouter
