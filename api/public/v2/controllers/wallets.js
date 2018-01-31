const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

const index = (req, res, next) => {
  db.wallets
    .paginate(utils.paginator(req))
    .then(wallets => utils.respondWithPagination(req, res, wallets, 'wallet'))
    .then(() => next())
}

const top = (req, res, next) => {
  db.wallets
    .top()
    .then(wallet => utils.respondWithCollection(req, res, wallet, 'wallet'))
    .then(() => next())
}

const show = (req, res, next) => {
  db.wallets
    .findById(req.params.id)
    .then(wallet => utils.respondWithResource(req, res, wallet, 'wallet'))
    .then(() => next())
}

const transactions = (req, res, next) => {
  db.wallets
    .findById(req.params.id)
    .then(wallet => db.transactions.findAllByWallet(wallet, utils.paginator(req)))
    .then(transactions => utils.respondWithPagination(req, res, transactions, 'transaction'))
    .then(() => next())
}

const transactionsSend = (req, res, next) => {
  db.wallets
    .findById(req.params.id)
    .then(wallet => db.transactions.findAllBySender(wallet.publicKey, utils.paginator(req)))
    .then(transactions => utils.respondWithPagination(req, res, transactions, 'transaction'))
    .then(() => next())
}

const transactionsReceived = (req, res, next) => {
  db.wallets
    .findById(req.params.id)
    .then(wallet => db.transactions.findAllByRecipient(wallet.address, utils.paginator(req)))
    .then(transactions => utils.respondWithPagination(req, res, transactions, 'transaction'))
    .then(() => next())
}

const votes = (req, res, next) => {
  db.wallets
    .findById(req.params.id)
    .then(wallet => db.transactions.allVotesBySender(wallet.publicKey, utils.paginator(req)))
    .then(transactions => utils.respondWithPagination(req, res, transactions, 'transaction'))
    .then(() => next())
}

const search = (req, res, next) => {
  db.wallets
    .search(req.body)
    .then(wallets => utils.respondWithPagination(req, res, wallets, 'wallet'))
    .then(() => next())
}

module.exports = {
  index,
  top,
  show,
  transactions,
  transactionsSend,
  transactionsReceived,
  votes,
  search,
}
