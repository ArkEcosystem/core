const controller = require('../controllers/delegates')

class DelegatesRouter {
  register(registrar) {
    registrar.get('delegates', controller.index)
    registrar.post('delegates/search', controller.search)
    registrar.get('delegates/:id', controller.show)
    registrar.get('delegates/:id/blocks', controller.blocks)
    registrar.get('delegates/:id/transactions', controller.transactions)
    registrar.get('delegates/:id/transactions/send', controller.transactionsSend)
    registrar.get('delegates/:id/transactions/received', controller.transactionsReceived)
    registrar.get('delegates/:id/voters', controller.voters)
  }
}

module.exports = new DelegatesRouter
