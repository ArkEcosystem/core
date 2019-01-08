const app = require('@arkecosystem/core-container')
const appHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

jest.setTimeout(60000)

exports.setUp = async () => {
  process.env.ARK_GRAPHQL_ENABLED = true

  await appHelper.setUp({
    exclude: ['@arkecosystem/core-api', '@arkecosystem/core-forger'],
  })

  return app
}

exports.tearDown = async () => {
  await app.tearDown()
}
