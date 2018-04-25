'use strict';

const database = require('@arkecosystem/core-plugin-manager').get('database')
const utils = require('../utils')
const schema = require('../schema/wallets')

/**
 * [index description]
 * @type {Object}
 */
exports.index = {
  handler: async (request, h) => {
    const wallets = await database.wallets.paginate(utils.paginate(request))

    return utils.toPagination(request, wallets, 'wallet')
  },
  options: {
    validate: schema.index
  }
}

/**
 * [top description]
 * @type {Object}
 */
exports.top = {
  handler: async (request, h) => {
    const wallets = await database.wallets.top(utils.paginate(request))

    return utils.toPagination(request, wallets, 'wallet')
  }
}

/**
 * [show description]
 * @type {Object}
 */
exports.show = {
  handler: async (request, h) => {
    const wallet = await database.wallets.findById(request.params.id)

    return utils.respondWithResource(request, wallet, 'wallet')
  },
  options: {
    validate: schema.show
  }
}

/**
 * [transactions description]
 * @type {Object}
 */
exports.transactions = {
  handler: async (request, h) => {
    const wallet = await database.wallets.findById(request.params.id)
    const transactions = await database.transactions.findAllByWallet(wallet, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.transactions
  }
}

/**
 * [transactionsSent description]
 * @type {Object}
 */
exports.transactionsSent = {
  handler: async (request, h) => {
    const wallet = await database.wallets.findById(request.params.id)
    const transactions = await database.transactions.findAllBySender(wallet.publicKey, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.transactionsSent
  }
}

/**
 * [transactionsReceived description]
 * @type {Object}
 */
exports.transactionsReceived = {
  handler: async (request, h) => {
    const wallet = await database.wallets.findById(request.params.id)
    const transactions = await database.transactions.findAllByRecipient(wallet.address, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.transactionsReceived
  }
}

/**
 * [votes description]
 * @type {Object}
 */
exports.votes = {
  handler: async (request, h) => {
    const wallet = await database.wallets.findById(request.params.id)
    const transactions = await database.transactions.allVotesBySender(wallet.publicKey, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.votes
  }
}

/**
 * [search description]
 * @type {Object}
 */
exports.search = {
  handler: async (request, h) => {
    const wallets = await database.wallets.search({
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
