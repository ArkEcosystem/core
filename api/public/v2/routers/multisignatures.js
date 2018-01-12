const controller = require('../controllers/multisignatures')

class MultiSignaturesRouter {
  register(registrar) {
    registrar.get('multisignatures', controller.index)
    registrar.get('multisignatures/pending', controller.pending)
    registrar.get('multisignatures/wallets', controller.wallets)
  }
}

module.exports = new MultiSignaturesRouter()
