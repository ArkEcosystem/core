const app = require('@phantomchain/core-container')
const appHelper = require('@phantomchain/core-test-utils/lib/helpers/container')

jest.setTimeout(30000)

exports.setUp = async () => {
  await appHelper.setUp({
    exit: '@phantomchain/core-blockchain',
    exclude: ['@phantomchain/core-transaction-pool-mem'],
  })
}

exports.tearDown = async () => {
  await app.tearDown()
}
