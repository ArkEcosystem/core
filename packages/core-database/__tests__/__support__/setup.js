'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

exports.setUp = async () => {
  jest.setTimeout(60000)

  process.env.ARK_SKIP_BLOCKCHAIN = true

  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core/lib/config/testnet'),
    token: 'ark',
    network: 'testnet'
  }, {
    exit: '@arkecosystem/core-blockchain',
    exclude: [
      '@arkecosystem/core-p2p',
      '@arkecosystem/core-transaction-pool',
      '@arkecosystem/core-transaction-pool-redis'
    ]
  })
}

exports.tearDown = async () => {
  await container.tearDown()
}
