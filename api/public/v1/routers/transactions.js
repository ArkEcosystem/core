const controller = require('../controllers/transactions')

class TransactionsRouter {
  register (registrar) {
    registrar.get('transactions', controller.index)
    registrar.get('transactions/get', controller.show)
    registrar.get('transactions/unconfirmed', controller.unconfirmed)
    registrar.get('transactions/unconfirmed/get', controller.showUnconfirmed)
  }
}

module.exports = new TransactionsRouter()
