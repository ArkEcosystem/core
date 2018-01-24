const controller = require('../controllers/blockchain')

module.exports = (registrar) => {
  registrar.get('blockchain', controller.index)
}
