const controller = require('../controllers/signatures')

class SignaturesRouter {
  register(registrar) {
    registrar.get('signatures', controller.index)
  }
}

module.exports = new SignaturesRouter()
