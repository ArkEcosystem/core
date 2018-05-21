'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

beforeAll(async (done) => {
  await container.start({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core-config/lib/networks/testnet'),
    token: 'ark',
    network: 'testnet'
  }, {
    include: [
      '@arkecosystem/core-config',
      '@arkecosystem/core-config-json',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston',
      '@arkecosystem/core-json-rpc'
    ]
  })

  done()
})

afterAll(async (done) => {
  await container.tearDown()

  done()
})
