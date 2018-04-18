const path = require('path')
const pluginManager = require('@arkecosystem/core-plugin-manager')

const config = require('./stubs/config')

const setupPluggy = async () => {
  pluginManager.init('../core-config/src/networks/devnet')

  pluginManager.setState({
    network: path.resolve(__dirname, '../../core-config/src/networks/devnet')
  })

  await pluginManager.hook('init')

  pluginManager.setState({
    config: pluginManager.get('config'),
    network: pluginManager.get('config').network.name
  })

  await pluginManager.hook('beforeCreate')

  const blockchainManager = pluginManager.get('blockchain')
  pluginManager.setState({ blockchainManager })

  await pluginManager.hook('beforeMount')
}

module.exports = async () => {
  await setupPluggy()

  await require('../src/server')(config)
}
