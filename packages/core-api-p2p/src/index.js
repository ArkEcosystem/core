'use strict';

const P2PInterface = require('./p2pinterface')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  register: async (manager, hook, options) => {
    manager.get('logger').info('Starting P2P Interface...')

    const p2p = new P2PInterface(options, manager.get('config'))
    await p2p.warmup()

    await manager.get('blockchain').attachNetworkInterface(p2p)
  }
}
