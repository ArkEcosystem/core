const controller = require('../controllers/delegates')

class DelegatesRouter {
  register(registrar) {
    registrar.get('delegates', controller.index)
    registrar.get('delegates/:id', controller.show)
    registrar.get('delegates/:id/blocks', controller.blocks)
    registrar.get('delegates/:id/voters', controller.voters)
  }
}

module.exports = new DelegatesRouter()
