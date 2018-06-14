'use strict';

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(30000)

exports.setUp = async () => {
  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core/lib/config/testnet'),
    token: 'ark',
    network: 'testnet'
  }, {
    exit: '@arkecosystem/core-blockchain',
    exclude: [
      '@arkecosystem/core-transaction-pool-redis',
      '@arkecosystem/core-p2p'
    ]
  })
}

exports.tearDown = async () => {
  await container.tearDown()
}
