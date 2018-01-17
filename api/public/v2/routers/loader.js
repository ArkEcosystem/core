const controller = require('../controllers/loader')

module.exports = (registrar) => {
  registrar.get('loader/status', controller.status)
  registrar.get('loader/syncing', controller.syncing)
  registrar.get('loader/configuration', controller.configuration)
}
