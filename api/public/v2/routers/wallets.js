const controllers = require('../controllers/wallets')

module.exports = (registrar) => {
  registrar.get('wallets', controllers.index)
  registrar.get('wallets/top', controllers.top)
  registrar.get('wallets/:id', controllers.show)
  registrar.get('wallets/:id/transactions', controllers.transactions)
  registrar.get('wallets/:id/transactions/send', controllers.transactionsSend)
  registrar.get('wallets/:id/transactions/received', controllers.transactionsReceived)
  registrar.get('wallets/:id/votes', controllers.votes)
}
