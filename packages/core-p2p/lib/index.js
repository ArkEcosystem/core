'use strict'

const PeerManager = require('./manager')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'p2p',
  async register (container, options) {
    container.resolvePlugin('logger').info('Starting P2P Interface')

    const p2p = new PeerManager(options)
    await p2p.start()

    return p2p
  },
  async deregister (container, options) {
    container.resolvePlugin('logger').info('Stopping P2P Interface')

    return container.resolvePlugin('p2p').stop()
  }
}
