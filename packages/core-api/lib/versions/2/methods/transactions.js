const Boom = require('boom')
const generateCacheKey = require('../../../utils/generate-cache-key')
const {
  transactions: transactionsRepository,
} = require('../../../repositories')
const utils = require('../utils')

const index = async request => {
  const transactions = await transactionsRepository.findAll({
    ...request.query,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, transactions, 'transaction')
}

const show = async request => {
  const transaction = await transactionsRepository.findById(request.params.id)

  if (!transaction) {
    return Boom.notFound('Transaction not found')
  }

  return utils.respondWithResource(request, transaction, 'transaction')
}

const search = async request => {
  const transactions = await transactionsRepository.search({
    ...request.query,
    ...request.payload,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, transactions, 'transaction')
}

module.exports = server => {
  server.method('v2.transactions.index', index, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...request.query,
        ...utils.paginate(request),
      }),
  })

  server.method('v2.transactions.show', show, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey({ id: request.params.id }),
  })

  server.method('v2.transactions.search', search, {
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
