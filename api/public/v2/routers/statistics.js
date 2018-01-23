const controller = require('../controllers/statistics')

module.exports = (registrar) => {
  registrar.get('stats/blockchain', controller.blockchain)
  registrar.get('stats/transactions', controller.transactions)
  registrar.get('stats/blocks', controller.blocks)
  registrar.get('stats/votes', controller.votes)
  registrar.get('stats/unvotes', controller.unvotes)
}
