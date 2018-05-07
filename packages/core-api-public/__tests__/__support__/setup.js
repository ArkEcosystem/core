'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

module.exports = async () => {
  const config = path.resolve(__dirname, '../../../core-config/lib/networks/testnet')

  container.init({ data: '~/.ark', config }, {
    exclude: [
      '@arkecosystem/core-api-p2p',
      '@arkecosystem/core-api-webhooks',
      '@arkecosystem/core-forger'
    ]
  })

  await container.plugins.registerGroup('init', {config})
  await container.plugins.registerGroup('beforeCreate')
  await container.plugins.registerGroup('beforeMount')
  await container.resolvePlugin('blockchain').start()

  container.plugins.registerGroup('mounted')
}
