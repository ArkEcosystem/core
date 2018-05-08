'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

beforeAll(async (done) => {
  const config = path.resolve(__dirname, '../../../core-config/lib/networks/devnet')

  container.init({ data: '~/.ark', config }, {
    exclude: [
      '@arkecosystem/core-api-p2p',
      '@arkecosystem/core-api-webhooks',
      '@arkecosystem/core-forger',
      '@arkecosystem/core-transaction-pool',
      '@arkecosystem/core-transaction-pool-redis',
      '@arkecosystem/core-webhooks',
      '@arkecosystem/core-api-webhooks',
      '@arkecosystem/core-graphql',
      '@arkecosystem/core-api-graphql'
    ]
  })

  await container.plugins.registerGroup('init', {config})
  await container.plugins.registerGroup('beforeCreate')
  await container.plugins.registerGroup('beforeMount')
  await container.resolvePlugin('blockchain').start()

  container.plugins.registerGroup('mounted')

  done()
})

afterAll(async (done) => {
  await container.teardown()

  done()
})
