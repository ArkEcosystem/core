'use strict'

const P2PInterface = require('./p2pinterface')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'p2p',
  register: async (container, options) => {
    container.get('logger').info('Starting P2P Interface...')

    const p2p = new P2PInterface(options, container.get('config'))
    await p2p.warmup(options.networkStart)

    return p2p
  },
  deregister: async (container) => {
    container.get('logger').info('Stopping P2P Interface...')

    return container.get('p2p').stop()
  }
}
