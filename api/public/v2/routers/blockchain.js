const controller = require('../controllers/blockchain')

module.exports = (registrar) => {
  registrar.get('blockchain', controller.index)
  registrar.get('blockchain/fees', controller.fees)
}
