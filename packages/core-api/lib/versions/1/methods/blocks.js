const generateCacheKey = require('../../../utils/generate-cache-key')
const { blocks: blocksRepository } = require('../../../repositories')
const utils = require('../utils')

const index = async request => {
  const { count, rows } = await blocksRepository.findAll({
    ...request.query,
    ...utils.paginate(request),
  })

  if (!rows) {
    return utils.respondWith('No blocks found', true)
  }

  return utils.respondWith({
    blocks: utils.toCollection(request, rows, 'block'),
    count,
  })
}

const show = async request => {
  const block = await blocksRepository.findById(request.query.id)

  if (!block) {
    return utils.respondWith(
      `Block with id ${request.query.id} not found`,
      true,
    )
  }

  return utils.respondWith({
    block: utils.toResource(request, block, 'block'),
  })
}

module.exports = server => {
  server.method('v1.blocks.index', index, {
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

  server.method('v1.blocks.show', show, {
    cache: {
      expiresIn: 600 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey({ id: request.query.id }),
  })
}
