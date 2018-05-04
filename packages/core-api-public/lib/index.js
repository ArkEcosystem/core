'use strict'

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'public-api',
  register: async (container, options) => {
    container.get('logger').info('Starting Public API...')

    return require('./server')(options)
  },
  deregister: async (container) => {
    container.get('logger').info('Stopping Public API...')

    return container.get('public-api').stop()
  }
}
