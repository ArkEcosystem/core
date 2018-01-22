const controller = require('../controllers/blocks')

module.exports = (registrar) => {
  registrar.get('blocks', controller.index)
  registrar.get('blocks/:id', controller.show)
  registrar.get('blocks/:id/transactions', controller.transactions)
  registrar.post('blocks/search', controller.search)
}
