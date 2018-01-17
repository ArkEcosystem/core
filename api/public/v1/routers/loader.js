const controller = require('../controllers/loader')

module.exports = (registrar) => {
  registrar.get('loader/status', controller.status)
  registrar.get('loader/status/sync', controller.syncing)
  registrar.get('loader/autoconfigure', controller.autoconfigure)
}
