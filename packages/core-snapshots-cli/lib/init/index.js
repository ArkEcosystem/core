'use strict'

const container = require('@arkecosystem/core-container')

exports.setUp = async (options) => {
  await container.setUp(options, {
    exit: '@arkecosystem/core-transaction-pool'
  })

  return container
}

exports.tearDown = async () => container.tearDown()
