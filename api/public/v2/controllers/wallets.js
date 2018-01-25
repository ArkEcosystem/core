const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

class WalletsController {
  index (req, res, next) {
    db.accounts
      .paginate(utils.paginator())
      .then(wallets => utils.respondWithPagination(wallets, 'wallet'))
  }

  top (req, res, next) {
    db.accounts
      .top()
      .then(wallet => utils.respondWithCollection(wallet, 'wallet'))
  }

  show (req, res, next) {
    db.accounts
      .findById(req.params.id)
      .then(wallet => utils.respondWithResource(wallet, 'wallet'))
  }

  transactions (req, res, next) {
    db.accounts
      .findById(req.params.id)
      .then(wallet => db.transactions.paginateAllByWallet(wallet, utils.paginator()))
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
  }

  transactionsSend (req, res, next) {
    db.accounts
      .findById(req.params.id)
      .then(wallet => db.transactions.paginateAllBySender(wallet.publicKey, utils.paginator()))
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
  }

  transactionsReceived (req, res, next) {
    db.accounts
      .findById(req.params.id)
      .then(wallet => db.transactions.paginateAllByRecipient(wallet.address, utils.paginator()))
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
  }

  votes (req, res, next) {
    db.accounts
      .findById(req.params.id)
      .then(wallet => db.transactions.paginateVotesBySender(wallet.publicKey, utils.paginator()))
      .then(transactions => utils.respondWithPagination(transactions, 'transaction'))
  }

  search (req, res, next) {
    db.accounts
      .search(req.body)
      .then(wallets => utils.respondWithPagination(wallets, 'wallet'))
  }
}

module.exports = new WalletsController()
