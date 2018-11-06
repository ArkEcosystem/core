'use strict'

const container = require('@arkecosystem/core-container')
const containerHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

jest.setTimeout(60000)

exports.setUp = async () => {
  process.env.ARK_WEBHOOKS_ENABLED = true

  await containerHelper.setUp({
    exclude: [
      '@arkecosystem/core-api',
      '@arkecosystem/core-graphql',
      '@arkecosystem/core-forger'
    ]
  })

  await require('../../lib/manager').setUp({})

  await require('../../lib/server')({
    enabled: false,
    host: process.env.ARK_WEBHOOKS_HOST || '0.0.0.0',
    port: process.env.ARK_WEBHOOKS_PORT || 4004,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1'],
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
