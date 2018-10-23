'use strict'

const container = require('@arkecosystem/core-container')

exports.setUpLite = async (options) => {
  console.log('setup')
  process.env.ARK_SKIP_BLOCKCHAIN = true
  await container.setUp(options, {
    include: [
      '@arkecosystem/core-config',
      '@arkecosystem/core-logger',
      '@arkecosystem/core-logger-winston',
      '@arkecosystem/core-snapshots'
    ]
  })

  console.log(container.plugins)
  return container
}

exports.tearDown = async () => container.tearDown()
