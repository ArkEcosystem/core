const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

class WalletsController {
  index (req, res, next) {
    db.wallets
      .paginate(utils.paginator())
      .then(wallets => utils.respondWithPagination(wallets, 'wallet'))
      .then(() => next())
  }

  top (req, res, next) {
    db.wallets
      .top()
      .then(wallet => utils.respondWithCollection(wallet, 'wallet'))
      .then(() => next())
  }

  show (req, res, next) {
    db.wallets
      .findById(req.params.id)
      .then(wallet => utils.respondWithResource(wallet, 'wallet'))
      .then(() => next())
  }

  transactions (req, res, next) {
    db.wallets
      .findById(req.params.id)
      .then(wallet => db.transactions.findAllByWallet(wallet, utils.paginator()))
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
      .then(() => next())
  }

  transactionsSend (req, res, next) {
    db.wallets
      .findById(req.params.id)
      .then(wallet => db.transactions.findAllBySender(wallet.publicKey, utils.paginator()))
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
      .then(() => next())
  }

  transactionsReceived (req, res, next) {
    db.wallets
      .findById(req.params.id)
      .then(wallet => db.transactions.findAllByRecipient(wallet.address, utils.paginator()))
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
      .then(() => next())
  }

  votes (req, res, next) {
    db.wallets
      .findById(req.params.id)
      .then(wallet => db.transactions.allVotesBySender(wallet.publicKey, utils.paginator()))
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
      .then(() => next())
  }

  search (req, res, next) {
    db.wallets
      .search(req.body)
      .then(wallets => utils.respondWithPagination(wallets, 'wallet'))
      .then(() => next())
  }
}

module.exports = new WalletsController()
