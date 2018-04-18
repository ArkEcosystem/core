const pluginManager = require('@arkecosystem/core-plugin-manager')

module.exports = async (config, options) => {
  pluginManager.init(config)
  pluginManager.setState({ network: config })

  await pluginManager.hook('init')

  pluginManager.setState({
    config: pluginManager.get('config'),
    network: pluginManager.get('config').network.name
  })

  await pluginManager.hook('beforeCreate')

  const blockchainManager = pluginManager.get('blockchain')
  pluginManager.setState({ blockchainManager })

  await pluginManager.hook('beforeMount')

  pluginManager.get('logger').info('Starting Blockchain Manager...')
  await blockchainManager.start()
  await blockchainManager.isReady()

  await pluginManager.hook('mounted')
}
