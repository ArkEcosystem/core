'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

exports.setUp = async () => {
  jest.setTimeout(10000)

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

  process.env.ARK_SKIP_BLOCKCHAIN = true
}

exports.tearDown = async () => container.tearDown()
