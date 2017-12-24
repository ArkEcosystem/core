const controller = require('../controllers/loader')

class LoaderRouter {
    register(registrar) {
        registrar.get('loader/status', controller.status)
        registrar.get('loader/syncing', controller.syncing)
        registrar.patch('loader/configure', controller.configure)
    }
}

module.exports = new LoaderRouter
