const app = require('@phantomchain/core-container')
const appHelper = require('@phantomchain/core-test-utils/lib/helpers/container')

exports.setUp = async () => {
  jest.setTimeout(60000)

  process.env.PHANTOM_SKIP_BLOCKCHAIN = true

  await appHelper.setUp({
    exit: '@phantomchain/core-blockchain',
    exclude: [
      '@phantomchain/core-p2p',
      '@phantomchain/core-transaction-pool-mem',
    ],
  })
}

exports.tearDown = async () => {
  await app.tearDown()
}
