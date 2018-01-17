const controller = require('../controllers/statistics')

module.exports = (registrar) => {
  registrar.get('statistics/transactions', controller.transactions)
  registrar.get('statistics/blocks', controller.blocks)

  // tx per block
  // tx per hour
  // tx per day
  // tx per week
  // tx per month

  // votes

  // incomming ark (from exchanges)
  // selling ark (to exchanges)
}
