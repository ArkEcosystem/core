const generateCacheKey = require('../../../utils/generate-cache-key')
const {
  transactions: transactionsRepository,
} = require('../../../repositories')
const utils = require('../utils')

const index = async request => {
  const { count, rows } = await transactionsRepository.findAllLegacy({
    ...request.query,
    ...utils.paginate(request),
  })

  if (!rows) {
    return utils.respondWith('No transactions found', true)
  }

  return utils.respondWith({
    transactions: utils.toCollection(request, rows, 'transaction'),
    count,
  })
}

const show = async request => {
  const result = await transactionsRepository.findById(request.query.id)

  if (!result) {
    return utils.respondWith('No transactions found', true)
  }

  return utils.respondWith({
    transaction: utils.toResource(request, result, 'transaction'),
  })
}

module.exports = server => {
  const generateTimeout = require('../../utils').getCacheTimeout()

  server.method('v1.transactions.index', index, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...request.query,
        ...utils.paginate(request),
      }),
  })

  server.method('v1.transactions.show', show, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey({ id: request.query.id }),
  })
}
