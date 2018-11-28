const app = require('@arkecosystem/core-container')
const appHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

jest.setTimeout(60000)

exports.setUp = async () => {
  await appHelper.setUp({
    exit: '@arkecosystem/core-blockchain',
  })
}

exports.tearDown = async () => {
  await app.tearDown()
}
