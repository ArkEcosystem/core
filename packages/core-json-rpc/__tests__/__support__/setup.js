'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

beforeAll(async (done) => {
  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core/lib/config/mainnet'),
    token: 'ark',
    network: 'mainnet'
  }, {
    exclude: [
      '@arkecosystem/core-api',
      '@arkecosystem/core-webhooks',
      '@arkecosystem/core-webhooks-api',
      '@arkecosystem/core-graphql',
      '@arkecosystem/core-graphql-api',
      '@arkecosystem/core-forger'
    ]
  })

  done()
})

afterAll(async (done) => {
  await container.tearDown()

  done()
})
