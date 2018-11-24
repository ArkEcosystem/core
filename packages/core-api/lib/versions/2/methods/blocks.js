const Boom = require('boom')
const generateCacheKey = require('../../../utils/generate-cache-key')
const {
  blocks: blocksRepository,
  transactions: transactionsRepository,
} = require('../../../repositories')
const utils = require('../utils')

const index = async request => {
  const blocks = await blocksRepository.findAll({
    ...request.query,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, blocks, 'block')
}

const show = async request => {
  const block = await blocksRepository.findById(request.params.id)

  if (!block) {
    return Boom.notFound('Block not found')
  }

  return utils.respondWithResource(request, block, 'block')
}

const transactions = async request => {
  const block = await blocksRepository.findById(request.params.id)

  if (!block) {
    return Boom.notFound('Block not found')
  }

  const rows = await transactionsRepository.findAllByBlock(block.id, {
    ...request.query,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, rows, 'transaction')
}

const search = async request => {
  const blocks = await blocksRepository.search({
    ...request.payload,
    ...request.query,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, blocks, 'block')
}

module.exports = server => {
  server.method('v2.blocks.index', index, {
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

  server.method('v2.blocks.show', show, {
    cache: {
      expiresIn: 600 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey({ id: request.params.id }),
  })

  server.method('v2.blocks.transactions', transactions, {
    cache: {
      expiresIn: 600 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...request.query,
        ...utils.paginate(request),
      }),
  })

  server.method('v2.blocks.search', search, {
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
