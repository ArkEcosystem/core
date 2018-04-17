const path = require('path')
const pluggy = require('@arkecosystem/core-pluggy')

const config = require('./stubs/config')

const setupPluggy = async () => {
  pluggy.init('../core/config/devnet')

  pluggy.setState({
    network: path.resolve(__dirname, '../../core/config/devnet')
  })

  await pluggy.hook('init')

  pluggy.setState({
    config: pluggy.get('config'),
    network: pluggy.get('config').network.name
  })

  await pluggy.hook('beforeCreate')

  const blockchainManager = pluggy.get('blockchain')
  pluggy.setState({ blockchainManager })

  await pluggy.hook('beforeMount')
}

module.exports = async () => {
  await setupPluggy()

  await require('../src/database').init(config.database)

  const manager = new (require('../src/manager'))(config)
  await manager.init(config)

  await require('../src/api')(config)
}
