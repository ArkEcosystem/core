'use strict';

const P2PInterface = require('./p2pinterface')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'p2p',
  register: async (manager, options) => {
    manager.get('logger').info('Starting P2P Interface...')

    const p2p = new P2PInterface(options, manager.get('config'))
    await p2p.warmup(options.networkStart || false)

    return p2p
  }
}
