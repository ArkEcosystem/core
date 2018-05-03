'use strict'

const path = require('path')
const pluginManager = require('@arkecosystem/core-plugin-manager')

module.exports = async () => {
  const config = path.resolve(__dirname, '../../../core-config/lib/networks/testnet')

  pluginManager.init({ data: '~/.ark', config }, {
    exclude: [
      '@arkecosystem/core-api-p2p',
      '@arkecosystem/core-transaction-pool-redis',
      '@arkecosystem/core-webhooks'
    ]
  })

  await pluginManager.hook('init', {config})
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')

  pluginManager.get('blockchain').start()
}
