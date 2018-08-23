const app = require('@phantomchain/core-container')
const appHelper = require('@phantomchain/core-test-utils/lib/helpers/container')

jest.setTimeout(60000)

exports.setUp = async () => {
  process.env.PHANTOM_WEBHOOKS_ENABLED = true

  await appHelper.setUp({
    exclude: [
      '@phantomchain/core-api',
      '@phantomchain/core-graphql',
      '@phantomchain/core-forger',
    ],
  })

  await require('../../lib/manager').setUp({})

  await require('../../lib/server')({
    enabled: false,
    host: process.env.PHANTOM_WEBHOOKS_HOST || '0.0.0.0',
    port: process.env.PHANTOM_WEBHOOKS_PORT || 4004,
    whitelist: ['127.0.0.1', '::ffff:127.0.0.1'],
    pagination: {
      limit: 100,
      include: ['/api/webhooks'],
    },
  })
}

exports.tearDown = async () => {
  await app.tearDown()
}
