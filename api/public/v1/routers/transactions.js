const controller = requireFrom('api/public/v1/controllers/transactions')
const schema = requireFrom('api/public/v1/schemas/blocks')

class TransactionsRouter {
  register(registrar) {
    registrar.get('transactions', controller.index, schema.getTransactions)
    registrar.get('transactions/get', controller.show, schema.getTransaction)
    registrar.get('transactions/unconfirmed', controller.unconfirmed)
    registrar.get('transactions/unconfirmed/get', controller.showUnconfirmed)
  }
}

module.exports = new TransactionsRouter()
