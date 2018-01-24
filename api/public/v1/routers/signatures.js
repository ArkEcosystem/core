const controller = require('../controllers/signatures')

module.exports = (registrar) => {
  registrar.get('signatures/fee', controller.fee)
}
