const controller = require('../controllers/delegates')

module.exports = (registrar) => {
  registrar.get('delegates', controller.index)
  registrar.get('delegates/get', controller.show)
  registrar.get('delegates/count', controller.count)
  registrar.get('delegates/search', controller.search)
  registrar.get('delegates/voters', controller.voters)
  registrar.get('delegates/fee', controller.fee)
  registrar.get('delegates/forging/getForgedByAccount', controller.forged)
  registrar.get('delegates/getNextForgers', controller.next)
  registrar.post('delegates/forging/enable', controller.enable)
  registrar.post('delegates/forging/disable', controller.disable)
}
