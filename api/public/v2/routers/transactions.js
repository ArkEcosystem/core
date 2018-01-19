const controller = require('../controllers/transactions')

module.exports = (registrar) => {
  registrar.get('transactions', controller.index)
  registrar.get('transactions/:id', controller.show)
  registrar.get('transactions/unconfirmed', controller.unconfirmed)
  registrar.get('transactions/unconfirmed/:id', controller.showUnconfirmed)
  registrar.post('transactions/search', controller.search)
}
