const Boom = require('boom')
const app = require('@arkecosystem/core-container')
const generateCacheKey = require('../../../utils/generate-cache-key')
const utils = require('../utils')
const {
  transactions: transactionsRepository,
} = require('../../../repositories')

const database = app.resolvePlugin('database')

const index = async request => {
  const wallets = await database.wallets.findAll({
    ...request.query,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, wallets, 'wallet')
}

const top = async request => {
  const wallets = await database.wallets.top(utils.paginate(request))

  return utils.toPagination(request, wallets, 'wallet')
}

const show = async request => {
  const wallet = await database.wallets.findById(request.params.id)

  if (!wallet) {
    return Boom.notFound('Wallet not found')
  }

  return utils.respondWithResource(request, wallet, 'wallet')
}

const transactions = async request => {
  const wallet = await database.wallets.findById(request.params.id)

  if (!wallet) {
    return Boom.notFound('Wallet not found')
  }

  const rows = await transactionsRepository.findAllByWallet(wallet, {
    ...request.query,
    ...request.params,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, rows, 'transaction')
}

const transactionsSent = async request => {
  const wallet = await database.wallets.findById(request.params.id)

  if (!wallet) {
    return Boom.notFound('Wallet not found')
  }

  // NOTE: We unset this value because it otherwise will produce a faulty SQL query
  delete request.params.id

  const rows = await transactionsRepository.findAllBySender(wallet.publicKey, {
    ...request.query,
    ...request.params,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, rows, 'transaction')
}

const transactionsReceived = async request => {
  const wallet = await database.wallets.findById(request.params.id)

  if (!wallet) {
    return Boom.notFound('Wallet not found')
  }

  // NOTE: We unset this value because it otherwise will produce a faulty SQL query
  delete request.params.id

  const rows = await transactionsRepository.findAllByRecipient(wallet.address, {
    ...request.query,
    ...request.params,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, rows, 'transaction')
}

const votes = async request => {
  const wallet = await database.wallets.findById(request.params.id)

  if (!wallet) {
    return Boom.notFound('Wallet not found')
  }

  // NOTE: We unset this value because it otherwise will produce a faulty SQL query
  delete request.params.id

  const rows = await transactionsRepository.allVotesBySender(wallet.publicKey, {
    ...request.params,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, rows, 'transaction')
}

const search = async request => {
  const wallets = await database.wallets.search({
    ...request.payload,
    ...request.query,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, wallets, 'wallet')
}

module.exports = server => {
  server.method('v2.wallets.index', index, {
    cache: {
      expiresIn: 30 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...request.payload,
        ...request.query,
        ...utils.paginate(request),
      }),
  })

  server.method('v2.wallets.top', top, {
    cache: {
      expiresIn: 30 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey(utils.paginate(request)),
  })

  server.method('v2.wallets.show', show, {
    cache: {
      expiresIn: 30 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey({ id: request.params.id }),
  })

  server.method('v2.wallets.transactions', transactions, {
    cache: {
      expiresIn: 30 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...request.query,
        ...request.params,
        ...utils.paginate(request),
      }),
  })

  server.method('v2.wallets.transactionsSent', transactionsSent, {
    cache: {
      expiresIn: 30 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...request.query,
        ...request.params,
        ...utils.paginate(request),
      }),
  })

  server.method('v2.wallets.transactionsReceived', transactionsReceived, {
    cache: {
      expiresIn: 30 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...request.query,
        ...request.params,
        ...utils.paginate(request),
      }),
  })

  server.method('v2.wallets.votes', votes, {
    cache: {
      expiresIn: 30 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...request.params,
        ...utils.paginate(request),
      }),
  })

  server.method('v2.wallets.search', search, {
    cache: {
      expiresIn: 30 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...request.payload,
        ...request.query,
        ...utils.paginate(request),
      }),
  })
}
