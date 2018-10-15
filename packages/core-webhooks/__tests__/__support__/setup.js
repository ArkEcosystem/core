'use strict'

const container = require('@arkecosystem/core-container')
const containerHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

jest.setTimeout(60000)

exports.setUp = async () => {
  process.env.ARK_WEBHOOKS_DISABLED = false

  await containerHelper.setUp({
    exclude: [
      '@arkecosystem/core-api',
      '@arkecosystem/core-graphql',
      '@arkecosystem/core-forger'
    ]
  })

  await require('../../lib/database').setUp({
    dialect: 'sqlite',
    storage: `${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK_NAME}/webhooks.sqlite`,
    logging: process.env.ARK_DB_LOGGING
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
