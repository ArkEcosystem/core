'use strict'

const path = require('path')
const container = require('@phantomcore/core-container')

exports.setUp = async () => {
  jest.setTimeout(10000)

  process.env.PHANTOM_SKIP_BLOCKCHAIN = true

  await container.setUp({
    data: '~/.phantom',
    config: path.resolve(__dirname, '../../../core/lib/config/testnet'),
    token: 'phantom',
    network: 'testnet'
  }, {
    exit: '@phantomcore/core-blockchain',
    exclude: [
      '@phantomcore/core-p2p',
      '@phantomcore/core-transaction-pool',
      '@phantomcore/core-transaction-pool-redis'
    ]
  })
}

exports.tearDown = async () => {
  await container.tearDown()
}
