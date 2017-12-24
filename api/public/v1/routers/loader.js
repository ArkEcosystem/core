const controller = require('../controllers/loader')

class LoaderRouter {
  register(registrar) {
    registrar.get('loader/status', controller.status)
    registrar.get('loader/status/sync', controller.syncing)
    registrar.get('loader/autoconfigure', controller.autoconfigure)
  }
}

module.exports = new LoaderRouter
