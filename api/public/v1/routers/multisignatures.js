const controller = require('../controllers/multisignatures')

module.exports = (registrar) => {
  registrar.get('multisignatures', controller.index)
  registrar.post('multisignatures', controller.store)
  registrar.get('multisignatures/pending', controller.pending)
  registrar.get('multisignatures/accounts', controller.wallets)
}
