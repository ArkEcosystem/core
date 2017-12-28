const controller = require('../controllers/forging')

class ForgingRouter {
  register(registrar) {
    registrar.get('forging/round', controller.round)
    registrar.get('forging/next', controller.next)
    registrar.get('forging/previous', controller.previous)
  }
}

module.exports = new ForgingRouter()
