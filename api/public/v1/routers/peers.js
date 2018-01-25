const controller = require('../controllers/peers')
const schema = require('../schemas/peers')

module.exports = (registrar) => {
  registrar.get('peers', controller.index, {schema: schema.getPeers})
  registrar.get('peers/get', controller.show, {schema: schema.getPeer})
  registrar.get('peers/version', controller.version)
}
