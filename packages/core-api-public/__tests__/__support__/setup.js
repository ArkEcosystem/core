'use strict'

const path = require('path')
const pluginManager = require('@arkecosystem/core-plugin-manager')

module.exports = async () => {
  const config = path.resolve(__dirname, '../../../core-config/lib/networks/devnet')

  pluginManager.init({ data: '~/.ark', config }, {
    exclude: [
      '@arkecosystem/core-api-p2p',
      '@arkecosystem/core-api-webhooks',
      '@arkecosystem/core-forger'
    ]
  })

  await pluginManager.hook('init', {config})
  await pluginManager.hook('beforeCreate')
  await pluginManager.hook('beforeMount')
  await pluginManager.get('blockchain').start()

  pluginManager.hook('mounted')
}
