'use strict'

const monitor = require('./monitor')
const startServer = require('./server')

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

    await monitor.start(options)

    monitor.server = await startServer(monitor, options)

    return monitor
  },
  async deregister (container, options) {
    container.resolvePlugin('logger').info('Stopping P2P Interface')

    return container.resolvePlugin('p2p').server.stop()
  }
}
