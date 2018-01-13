const controller = require('../controllers/peers')

class PeersRouter {
  register (registrar) {
    registrar.get('peers', controller.index)
    registrar.get('peers/get', controller.show)
    registrar.get('peers/version', controller.version)
  }
}

module.exports = new PeersRouter()
