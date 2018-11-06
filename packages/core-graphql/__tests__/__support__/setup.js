'use strict'

const container = require('@arkecosystem/core-container')
const containerHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

jest.setTimeout(60000)

exports.setUp = async () => {
  process.env.ARK_GRAPHQL_ENABLED = true

  await containerHelper.setUp({
    exclude: [
      '@arkecosystem/core-api',
      '@arkecosystem/core-forger'
    ]
  })

  return container
}

exports.tearDown = async () => {
  await container.tearDown()
}
