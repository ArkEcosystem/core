const controller = require('../controllers/delegates')

module.exports = (registrar) => {
  registrar.get('delegates', controller.index)
  registrar.get('delegates/:id', controller.show)
  registrar.get('delegates/:id/blocks', controller.blocks)
  registrar.get('delegates/:id/voters', controller.voters)
}
