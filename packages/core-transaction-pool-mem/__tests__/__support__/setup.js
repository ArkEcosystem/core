const app = require('@arkecosystem/core-container')
const appHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

jest.setTimeout(30000)

exports.setUp = async () => {
  await appHelper.setUp({
    exit: '@arkecosystem/core-blockchain',
    exclude: ['@arkecosystem/core-transaction-pool-mem'],
  })
}

exports.tearDown = async () => {
  await app.tearDown()
}
