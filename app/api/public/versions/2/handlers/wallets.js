const db = require('../../../../../core/dbinterface').getInstance()
const utils = require('../utils')
const schema = require('../schema/wallets')

exports.index = {
  handler: async (request, h) => {
    const wallets = await db.wallets.paginate(utils.paginate(request))

    return utils.toPagination(request, wallets, 'wallet')
  },
  options: {
    validate: schema.index
  }
}

exports.top = {
  handler: async (request, h) => {
    const wallet = await db.wallets.top()

    return utils.respondWithCollection(request, wallet, 'wallet')
  }
}

exports.show = {
  handler: async (request, h) => {
    const wallet = await db.wallets.findById(request.params.id)

    return utils.respondWithResource(request, wallet, 'wallet')
  },
  options: {
    validate: schema.show
  }
}

exports.transactions = {
  handler: async (request, h) => {
    const wallet = await db.wallets.findById(request.params.id)
    const transactions = await db.transactions.findAllByWallet(wallet, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.transactions
  }
}

exports.transactionsSend = {
  handler: async (request, h) => {
    const wallet = await db.wallets.findById(request.params.id)
    const transactions = await db.transactions.findAllBySender(wallet.publicKey, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.transactionsSend
  }
}

exports.transactionsReceived = {
  handler: async (request, h) => {
    const wallet = await db.wallets.findById(request.params.id)
    const transactions = await db.transactions.findAllByRecipient(wallet.address, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.transactionsReceived
  }
}

exports.votes = {
  handler: async (request, h) => {
    const wallet = await db.wallets.findById(request.params.id)
    const transactions = await db.transactions.allVotesBySender(wallet.publicKey, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.votes
  }
}

exports.search = {
  handler: async (request, h) => {
    const wallets = await db.wallets.search({
      ...request.payload,
      ...request.query,
      ...utils.paginate(request)
    })

    return utils.toPagination(request, wallets, 'wallet')
  },
  options: {
    validate: schema.search
  }
}
