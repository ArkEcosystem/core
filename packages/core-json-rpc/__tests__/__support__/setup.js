'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

exports.setUp = async () => {
  process.env.ARK_JSON_RPC_ENABLED = true

  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, './config'),
    token: 'ark',
    network: 'testnet'
  }, {
    exclude: [
      '@arkecosystem/core-api',
      '@arkecosystem/core-webhooks',
      '@arkecosystem/core-graphql',
      '@arkecosystem/core-forger'
    ]
  })
}

exports.tearDown = async () => {
  await container.tearDown()
}
