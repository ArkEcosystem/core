'use strict'

const container = require('@arkecosystem/core-container')

exports.setUpLite = async (options) => {
  process.env.ARK_SKIP_BLOCKCHAIN = true
  await container.setUp(options, {
    include: [
      '@arkecosystem/core-config',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston'
    ]
  })

  return container
}

exports.tearDown = async () => container.tearDown()

exports.getPath = (fileName) => {
  return `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}/${fileName}`
}
