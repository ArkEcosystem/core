const app = require('@phantomchain/core-container')
const appHelper = require('@phantomchain/core-test-utils/lib/helpers/container')

jest.setTimeout(60000)

exports.setUp = async () => {
  process.env.PHANTOM_GRAPHQL_ENABLED = true

  await appHelper.setUp({
    exclude: ['@phantomchain/core-api', '@phantomchain/core-forger'],
  })

  return app
}

exports.tearDown = async () => {
  await app.tearDown()
}
