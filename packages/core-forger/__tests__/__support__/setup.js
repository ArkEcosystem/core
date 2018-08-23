const app = require('@phantomchain/core-container')
const appHelper = require('@phantomchain/core-test-utils/lib/helpers/container')

exports.setUp = async () => {
  await appHelper.setUp({
    exit: '@phantomchain/core-logger-winston',
  })
}

exports.tearDown = async () => {
  await app.tearDown()
}
