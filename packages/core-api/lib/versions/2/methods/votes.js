const Boom = require('boom')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const generateCacheKey = require('../../../utils/generate-cache-key')
const {
  transactions: transactionsRepository,
} = require('../../../repositories')
const utils = require('../utils')

const index = async request => {
  const transactions = await transactionsRepository.findAllByType(
    TRANSACTION_TYPES.VOTE,
    {
      ...request.query,
      ...utils.paginate(request),
    },
  )

  return utils.toPagination(request, transactions, 'transaction')
}

const show = async request => {
  const transaction = await transactionsRepository.findByTypeAndId(
    TRANSACTION_TYPES.VOTE,
    request.params.id,
  )

  if (!transaction) {
    return Boom.notFound('Vote not found')
  }

  return utils.respondWithResource(request, transaction, 'transaction')
}

module.exports = server => {
  server.method('v2.votes.index', index, {
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

  server.method('v2.votes.show', show, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey({ id: request.params.id }),
  })
}
