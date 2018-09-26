'use strict';

const container = require('@arkecosystem/core-container')
const containerHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

jest.setTimeout(30000)

exports.setUp = async () => {
  await containerHelper.setUp({
    exit: '@arkecosystem/core-blockchain',
    exclude: [
      '@arkecosystem/core-transaction-pool-redis'
    ]
  })
}

exports.tearDown = async () => {
  await container.tearDown()
}
