const app = require('@arkecosystem/core-container')
const generateCacheKey = require('../../../utils/generate-cache-key')
const utils = require('../utils')

const database = app.resolvePlugin('database')

const index = async request => {
  const { count, rows } = await database.delegates.paginate({
    ...request.query,
    ...{
      offset: request.query.offset || 0,
      limit: request.query.limit || 51,
    },
  })

  return utils.respondWith({
    delegates: utils.toCollection(request, rows, 'delegate'),
    totalCount: count,
  })
}

const show = async request => {
  if (!request.query.publicKey && !request.query.username) {
    return utils.respondWith('Delegate not found', true)
  }

  const delegate = await database.delegates.findById(
    request.query.publicKey || request.query.username,
  )

  if (!delegate) {
    return utils.respondWith('Delegate not found', true)
  }

  return utils.respondWith({
    delegate: utils.toResource(request, delegate, 'delegate'),
  })
}

const count = async request => {
  const delegate = await database.delegates.findAll()

  return utils.respondWith({ count: delegate.count })
}

const search = async request => {
  const { rows } = await database.delegates.search({
    ...{ username: request.query.q },
    ...utils.paginate(request),
  })

  return utils.respondWith({
    delegates: utils.toCollection(request, rows, 'delegate'),
  })
}

const voters = async request => {
  const delegate = await database.delegates.findById(request.query.publicKey)

  if (!delegate) {
    return utils.respondWith({
      accounts: [],
    })
  }

  const accounts = await database.wallets.findAllByVote(delegate.publicKey)

  return utils.respondWith({
    accounts: utils.toCollection(request, accounts.rows, 'voter'),
  })
}

module.exports = server => {
  server.method('v1.delegates.index', index, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...request.query,
        ...{
          offset: request.query.offset || 0,
          limit: request.query.limit || 51,
        },
      }),
  })

  server.method('v1.delegates.show', show, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        id: request.query.publicKey || request.query.username,
      }),
  })

  server.method('v1.delegates.count', count, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey({ time: +new Date() }),
  })

  server.method('v1.delegates.search', search, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({
        ...{ username: request.query.q },
        ...utils.paginate(request),
      }),
  })

  server.method('v1.delegates.voters', voters, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request => generateCacheKey({ id: request.query.publicKey }),
  })
}
