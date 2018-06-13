'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

beforeAll(async () => {
  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core/lib/config/mainnet'),
    token: 'ark',
    network: 'mainnet'
  }, {
    exclude: [
      '@arkecosystem/core-api',
      '@arkecosystem/core-webhooks',
      '@arkecosystem/core-graphql',
      '@arkecosystem/core-forger'
    ],
    options: {
      '@arkecosystem/core-json-rpc': {
        enabled: true
      }
    }
  })
})

afterAll(async () => {
  await container.tearDown()
})
