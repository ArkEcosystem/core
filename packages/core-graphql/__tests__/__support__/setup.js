'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

exports.setUp = async () => {
  process.env.ARK_GRAPHQL_ENABLED = true

  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core/lib/config/testnet'),
    network: 'testnet',
    token: 'ark'
  }, {
    exclude: [
      '@arkecosystem/core-api',
      '@arkecosystem/core-forger'
    ]
  })

  return container
}

exports.tearDown = async () => {
  await container.tearDown()
}
