'use strict'

const { asValue } = require('awilix')
const Blockchain = require('./blockchain')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'blockchain',
  async register (container, options) {
    const blockchain = new Blockchain(options.networkStart)

    container.register('state', asValue(
      require('./state-storage')
    ))

    if (!process.env.ARK_SKIP_BLOCKCHAIN) {
      await blockchain.start()
    }

    return blockchain
  },
  async deregister (container, options) {
    await container.resolvePlugin('blockchain').stop()
  }
}

/**
 * Access to the state.
 * @type {StateStorage}
 */
exports.state = require('./state-storage')
