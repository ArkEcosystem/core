const app = require('@phantomchain/core-container')
const appHelper = require('@phantomchain/core-test-utils/lib/helpers/container')

jest.setTimeout(60000)

exports.setUp = async () => {
  await appHelper.setUp({
    exit: '@phantomchain/core-blockchain',
  })
}

exports.tearDown = async () => {
  await app.tearDown()
}
