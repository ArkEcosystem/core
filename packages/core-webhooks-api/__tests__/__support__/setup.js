'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

const defaults = require('../__stubs__/defaults.json')

module.exports = async () => {
  await container.start({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core-config/lib/networks/testnet')
  }, {
    exclude: [
      '@arkecosystem/core-blockchain',
      '@arkecosystem/core-api',
      '@arkecosystem/core-webhooks-api',
      '@arkecosystem/core-graphql',
      '@arkecosystem/core-graphql-api'
    ]
  })

  await require('../../lib/server')(defaults)
}
