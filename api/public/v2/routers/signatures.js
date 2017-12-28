const controller = require('../controllers/signatures')

class SignaturesRouter {
  register(registrar) {
    registrar.get('signatures', controller.index)
    registrar.post('signatures', controller.store)
  }
}

module.exports = new SignaturesRouter()
