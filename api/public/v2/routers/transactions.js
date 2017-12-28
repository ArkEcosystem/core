const controller = require('../controllers/transactions')

class TransactionsRouter {
  register(registrar) {
    registrar.get('transactions', controller.index)
    registrar.post('transactions', controller.store)
    registrar.get('transactions/:id', controller.show)
    registrar.get('transactions/unconfirmed', controller.unconfirmed)
    registrar.get('transactions/unconfirmed/:id', controller.showUnconfirmed)
    registrar.get('transactions/fees', controller.fees)
    registrar.get('transactions/fees/:type', controller.showFee)
  }
}

module.exports = new TransactionsRouter()
