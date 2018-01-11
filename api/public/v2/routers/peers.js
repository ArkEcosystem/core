const controller = require('../controllers/peers')

class PeersRouter {
  register(registrar) {
    registrar.get('peers', controller.index)
    registrar.get('peers/me', controller.me)
    registrar.get('peers/:ip', controller.show)
  }
}

module.exports = new PeersRouter()
