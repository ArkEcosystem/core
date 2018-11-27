const app = require('@arkecosystem/core-container')
const appHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

exports.setUp = async () => {
  await appHelper.setUp({
    exit: '@arkecosystem/core-logger-winston',
  })
}

exports.tearDown = async () => {
  await app.tearDown()
}
