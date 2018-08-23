'use strict';

const path = require('path')
const container = require('@phantomcore/core-container')

jest.setTimeout(30000)

exports.setUp = async () => {
  await container.setUp({
    data: '~/.phantom',
    config: path.resolve(__dirname, '../../../core/lib/config/testnet'),
    token: 'phantom',
    network: 'testnet'
  }, {
    exit: '@phantomcore/core-blockchain',
    exclude: [
      '@phantomcore/core-transaction-pool-redis',
      '@phantomcore/core-p2p'
    ]
  })
}

exports.tearDown = async () => {
  await container.tearDown()
}
