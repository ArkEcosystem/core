const controller = require('../controllers/multisignatures')

module.exports = (registrar) => {
  registrar.get('multisignatures', controller.index)
  registrar.get('multisignatures/pending', controller.pending)
  registrar.get('multisignatures/wallets', controller.wallets)
}
