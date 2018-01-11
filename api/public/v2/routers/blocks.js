const controller = require('../controllers/blocks')

class BlocksRouter {
  register(registrar) {
    registrar.get('blocks', controller.index)
    registrar.get('blocks/:id', controller.show)
    registrar.get('blocks/:id/transactions', controller.transactions)
  }
}

module.exports = new BlocksRouter()
