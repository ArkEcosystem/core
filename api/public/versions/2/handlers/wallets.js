const db = require('core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return db.wallets
      .paginate(utils.paginate(request))
      .then(wallets => h.response({
        results: utils.toCollection(request, wallets.rows, 'wallet'),
        totalCount: wallets.count
      }))
  }
}

exports.top = {
  handler: (request, h) => {
    return db.wallets
      .top()
      .then(wallet => utils.respondWithCollection(request, wallet, 'wallet'))
  }
}

exports.show = {
  handler: (request, h) => {
    return db.wallets
      .findById(request.params.id)
      .then(wallet => utils.respondWithResource(request, wallet, 'wallet'))
  }
}

exports.transactions = {
  handler: (request, h) => {
    return db.wallets
      .findById(request.params.id)
      .then(wallet => db.transactions.findAllByWallet(wallet, utils.paginate(request)))
      .then(transactions => h.response({
        results: utils.toCollection(request, transactions.rows, 'transaction'),
        totalCount: transactions.count
      }))
  }
}

exports.transactionsSend = {
  handler: (request, h) => {
    return db.wallets
      .findById(request.params.id)
      .then(wallet => db.transactions.findAllBySender(wallet.publicKey, utils.paginate(request)))
      .then(transactions => h.response({
        results: utils.toCollection(request, transactions.rows, 'transaction'),
        totalCount: transactions.count
      }))
  }
}

exports.transactionsReceived = {
  handler: (request, h) => {
    return db.wallets
      .findById(request.params.id)
      .then(wallet => db.transactions.findAllByRecipient(wallet.address, utils.paginate(request)))
      .then(transactions => h.response({
        results: utils.toCollection(request, transactions.rows, 'transaction'),
        totalCount: transactions.count
      }))
  }
}

exports.votes = {
  handler: (request, h) => {
    return db.wallets
      .findById(request.params.id)
      .then(wallet => db.transactions.allVotesBySender(wallet.publicKey, utils.paginate(request)))
      .then(transactions => h.response({
        results: utils.toCollection(request, transactions.rows, 'transaction'),
        totalCount: transactions.count
      }))
  }
}

exports.search = {
  handler: (request, h) => {
    return db.wallets
      .search(request.query)
      .then(wallets => h.response({
        results: utils.toCollection(request, wallets.rows, 'wallet'),
        totalCount: wallets.count
      }))
  }
}
