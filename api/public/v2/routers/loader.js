const controller = require('../controllers/loader')

class LoaderRouter {
    register(registrar) {
        registrar.get('loader/status', controller.status)
        registrar.get('loader/syncing', controller.syncing)
        registrar.get('loader/configuration', controller.configuration)
    }
}

module.exports = new LoaderRouter
