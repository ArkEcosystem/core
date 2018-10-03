'use strict'

const IPFSManager = require('./manager')

/**
 * The struct used by the plugin container.
 * @type {WinstonDriver}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'ipfs',
  register: async (container, options) => {
    if (options.enabled) {
      container.resolvePlugin('logger').info('IPFS Enabled, starting node...')
    } else {
      container.resolvePlugin('logger').info('IPFS Disabled, check config file')
      return
    }

    let manager = new IPFSManager(options)

    await manager.start()

    return manager
  },
  deregister: async (container, options) => {
    container.resolvePlugin('logger').info('IPFS shutting down')
    await container.resolvePlugin('ipfs').stop()
  }
}
