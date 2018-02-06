const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return db.wallets
      .paginate(utils.paginate(request))
      .then(wallets => utils.toPagination(request, wallets, 'wallet'))
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
      .then(transactions => utils.toPagination(request, transactions, 'transaction'))
  }
}

exports.transactionsSend = {
  handler: (request, h) => {
    return db.wallets
      .findById(request.params.id)
      .then(wallet => db.transactions.findAllBySender(wallet.publicKey, utils.paginate(request)))
      .then(transactions => utils.toPagination(request, transactions, 'transaction'))
  }
}

exports.transactionsReceived = {
  handler: (request, h) => {
    return db.wallets
      .findById(request.params.id)
      .then(wallet => db.transactions.findAllByRecipient(wallet.address, utils.paginate(request)))
      .then(transactions => utils.toPagination(request, transactions, 'transaction'))
  }
}

exports.votes = {
  handler: (request, h) => {
    return db.wallets
      .findById(request.params.id)
      .then(wallet => db.transactions.allVotesBySender(wallet.publicKey, utils.paginate(request)))
      .then(transactions => utils.toPagination(request, transactions, 'transaction'))
  }
}

exports.search = {
  handler: (request, h) => {
    return db.wallets
      .search(request.query)
      .then(wallets => utils.toPagination(request, wallets, 'wallet'))
  }
}
