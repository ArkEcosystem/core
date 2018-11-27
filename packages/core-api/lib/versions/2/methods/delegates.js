const Boom = require('boom')
const orderBy = require('lodash/orderBy')
const app = require('@arkecosystem/core-container')
const generateCacheKey = require('../../../utils/generate-cache-key')
const { blocks: blocksRepository } = require('../../../repositories')
const utils = require('../utils')

const database = app.resolvePlugin('database')

const index = async request => {
  const delegates = await database.delegates.paginate({
    ...request.query,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, delegates, 'delegate')
}

const show = async request => {
  const delegate = await database.delegates.findById(request.params.id)

  if (!delegate) {
    return Boom.notFound('Delegate not found')
  }

  return utils.respondWithResource(request, delegate, 'delegate')
}

const search = async request => {
  const delegates = await database.delegates.search({
    ...request.payload,
    ...request.query,
    ...utils.paginate(request),
  })

  return utils.toPagination(request, delegates, 'delegate')
}

const blocks = async request => {
  const delegate = await database.delegates.findById(request.params.id)

  if (!delegate) {
    return Boom.notFound('Delegate not found')
  }

  const rows = await blocksRepository.findAllByGenerator(
    delegate.publicKey,
    utils.paginate(request),
  )

  return utils.toPagination(request, rows, 'block')
}

const voters = async request => {
  const delegate = await database.delegates.findById(request.params.id)

  if (!delegate) {
    return Boom.notFound('Delegate not found')
  }

  const wallets = await database.wallets.findAllByVote(
    delegate.publicKey,
    utils.paginate(request),
  )

  return utils.toPagination(request, wallets, 'wallet')
}

const voterBalances = async request => {
  const delegate = await database.delegates.findById(request.params.id)

  if (!delegate) {
    return Boom.notFound('Delegate not found')
  }

  const wallets = await database.wallets
    .all()
    .filter(wallet => wallet.vote === delegate.publicKey)

  const data = {}
  orderBy(wallets, ['balance'], ['desc']).forEach(wallet => {
    data[wallet.address] = +wallet.balance.toFixed()
  })

  return { data }
}

module.exports = server => {
  server.method('v2.delegates.index', index, {
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

  server.method('v2.delegates.show', show, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey({ id: request.params.id }),
  })

  server.method('v2.delegates.search', search, {
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

  server.method('v2.delegates.blocks', blocks, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...{ id: request.params.id },
        ...utils.paginate(request),
      }),
  })

  server.method('v2.delegates.voters', voters, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...{ id: request.params.id },
        ...utils.paginate(request),
      }),
  })

  server.method('v2.delegates.voterBalances', voterBalances, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey({ id: request.params.id }),
  })
}
