const { client } = require('@arkecosystem/crypto')
const loader = require('./loader')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'config',
  async register(container, options) {
    const config = await loader.setUp(options)

    client.setConfig(config.network)

    return config
  },
}
