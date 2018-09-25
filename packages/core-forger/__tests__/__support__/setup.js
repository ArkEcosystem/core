'use strict'

const container = require('@arkecosystem/core-container')
const containerHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

exports.setUp = async () => {
  await containerHelper.setUp({
    exit: '@arkecosystem/core-logger-winston'
  })
}

exports.tearDown = async () => {
  await container.tearDown()
}
