const controller = require('../controllers/statistics')

module.exports = (registrar) => {
  registrar.get('stats/blockchain', controller.blockchain)
  registrar.get('stats/transactions', controller.transactions)
  registrar.get('stats/blocks', controller.blocks)

  // tx per block
  // tx per hour
  // tx per day
  // tx per week
  // tx per month

  // votes

  // incomming ark (from exchanges)
  // selling ark (to exchanges)
}
