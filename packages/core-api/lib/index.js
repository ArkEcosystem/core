'use strict'

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'public-api',
  async register (container, options) {
    if (options.enabled) {
      container.resolvePlugin('logger').info('Starting Public API...')

      return require('./server')(options)
    }
  },
  async deregister (container, options) {
    if (options.enabled) {
      container.resolvePlugin('logger').info('Stopping Public API...')

      return container.resolvePlugin('public-api').stop()
    }
  }
}
