const controller = require('../controllers/signatures')

module.exports = (registrar) => {
  registrar.get('signatures', controller.index)
}
