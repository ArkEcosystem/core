'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

exports.setUp = async () => {
  jest.setTimeout(60000)

  process.env.ARK_GRAPHQL_ENABLED = true
  process.env.ARK_GRAPHQL_HOST = 'localhost'
  process.env.ARK_GRAPHQL_PORT = 4005

  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core/lib/config/testnet'),
    token: 'ark',
    network: 'testnet'
  }, {
  })

  return container
}

exports.tearDown = async () => container.tearDown()
