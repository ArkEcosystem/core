const app = require('@arkecosystem/core-container')
const generateCacheKey = require('../../../utils/generate-cache-key')
const utils = require('../utils')

const database = app.resolvePlugin('database')

const index = async request => {
  const { rows } = await database.wallets.findAll({
    ...request.query,
    ...utils.paginate(request),
  })

  return utils.respondWith({
    accounts: utils.toCollection(request, rows, 'account'),
  })
}

const show = async request => {
  const account = await database.wallets.findById(request.query.address)

  if (!account) {
    return utils.respondWith('Account not found', true)
  }

  return utils.respondWith({
    account: utils.toResource(request, account, 'account'),
  })
}

const balance = async request => {
  const account = await database.wallets.findById(request.query.address)

  if (!account) {
    return utils.respondWith({ balance: '0', unconfirmedBalance: '0' })
  }

  return utils.respondWith({
    balance: account ? `${account.balance}` : '0',
    unconfirmedBalance: account ? `${account.balance}` : '0',
  })
}

const publicKey = async request => {
  const account = await database.wallets.findById(request.query.address)

  if (!account) {
    return utils.respondWith('Account not found', true)
  }

  return utils.respondWith({ publicKey: account.publicKey })
}

module.exports = server => {
  server.method('v1.accounts.index', index, {
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

  server.method('v1.accounts.show', show, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({ address: request.query.address }),
  })

  server.method('v1.accounts.balance', balance, {
    cache: {
      expiresIn: 8 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({ address: request.query.address }),
  })

  server.method('v1.accounts.publicKey', publicKey, {
    cache: {
      expiresIn: 600 * 1000,
      generateTimeout: 3000,
      getDecoratedValue: true,
    },
    generateKey: request =>
      generateCacheKey({ address: request.query.address }),
  })
}
