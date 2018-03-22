const db = require('../../../../../core/dbinterface').getInstance()
const chainInstance = require('../../../../../core/managers/blockchain').getInstance()
const utils = require('../utils')
const Transaction = require('../../../../../models/transaction')

exports.index = {
  handler: async (request, h) => {
    const transactions = await db.transactions.findAll(utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  }
}

exports.store = {
  handler: async (request, h) => {
    const transactions = request.payload.transactions
      .map(transaction => Transaction.deserialize(Transaction.serialize(transaction).toString('hex')))

    chainInstance.postTransactions(transactions)

    return { transactionIds: [] }
  }
}

exports.show = {
  handler: async (request, h) => {
    const transaction = await db.transactions.findById(request.params.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}

exports.unconfirmed = {
  handler: async (request, h) => {
    const pagination = utils.paginate(request)
    const transactions = await chainInstance.getTxPool().getUnconfirmedTransactions(pagination.offset, pagination.limit)

    return utils.toPagination({
      count: transactions.length,
      rows: transactions
    }, transactions, 'transaction')
  }
}

exports.showUnconfirmed = {
  handler: async (request, h) => {
    const transaction = await chainInstance.getTxPool().getUnconfirmedTransaction(request.param.id)

    return utils.respondWithResource(request, transaction, 'transaction')
  }
}

exports.search = {
  handler: async (request, h) => {
    const transactions = await db.transactions.search({...request.query, ...utils.paginate(request)})

    return utils.toPagination(request, transactions, 'transaction')
  }
}

exports.types = {
  handler: async (request, h) => {
    return {
      data: require('../../../../../core/constants').TRANSACTION_TYPES
    }
  }
}
