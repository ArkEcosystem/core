const controller = require('../controllers/peers')

class PeersRouter {
  register(registrar) {
    registrar.get('peers', controller.index)
    registrar.post('peers/search', controller.search)
    registrar.get('peers/me', controller.me)
    registrar.get('peers/:ip/:port', controller.show)
  }
}

module.exports = new PeersRouter
