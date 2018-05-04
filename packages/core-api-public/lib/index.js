'use strict'

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'public-api',
  register: async (manager, options) => {
    manager.get('logger').info('Starting Public API...')

    return require('./server')(options)
  },
  deregister: async (manager) => {
    manager.get('logger').info('Stopping Public API...')

    return manager.get('public-api').stop()
  }
}
