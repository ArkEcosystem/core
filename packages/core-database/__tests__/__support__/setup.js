'use strict'

const container = require('@arkecosystem/core-container')
const containerHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

exports.setUp = async () => {
  jest.setTimeout(60000)

  process.env.ARK_SKIP_BLOCKCHAIN = true

  await containerHelper.setUp({
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
