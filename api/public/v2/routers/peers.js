const controller = require('../controllers/peers')

module.exports = (registrar) => {
  registrar.get('peers', controller.index)
  registrar.get('peers/me', controller.me)
  registrar.get('peers/:ip', controller.show)
}
