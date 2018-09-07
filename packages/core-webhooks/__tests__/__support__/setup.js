'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

exports.setUp = async () => {
  process.env.ARK_WEBHOOKS_ENABLED = true

  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core/lib/config/testnet'),
    token: 'ark',
    network: 'testnet'
  }, {
    exclude: [
      '@arkecosystem/core-api',
      '@arkecosystem/core-graphql',
      '@arkecosystem/core-forger'
    ]
  })

  await require('../../lib/manager').setUp({
    redis: {
      host: process.env.ARK_REDIS_HOST || 'localhost',
      port: process.env.ARK_REDIS_PORT || 6379
    }
  })

  await require('../../lib/server')({
    enabled: false,
    host: process.env.ARK_WEBHOOKS_HOST || '0.0.0.0',
    port: process.env.ARK_WEBHOOKS_PORT || 4004,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '192.168.*'],
    pagination: {
      limit: 100,
      include: [
        '/api/webhooks'
      ]
    }
  })
}

exports.tearDown = async () => {
  await container.tearDown()
}
