const app = require('@arkecosystem/core-container')
const appHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

exports.setUp = async () => {
  jest.setTimeout(60000)

  process.env.ARK_SKIP_BLOCKCHAIN = true

  await appHelper.setUp({
    exit: '@arkecosystem/core-blockchain',
    exclude: [
      '@arkecosystem/core-p2p',
      '@arkecosystem/core-transaction-pool-mem',
    ],
  })
}

exports.tearDown = async () => {
  await app.tearDown()
}
