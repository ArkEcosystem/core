'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

exports.setUp = async () => {
  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core/lib/config/testnet'),
    token: 'ark',
    network: 'testnet'
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
}

exports.tearDown = async () => {
  await container.tearDown()
}
