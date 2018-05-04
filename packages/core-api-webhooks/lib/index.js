'use strict'

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'webhooks-api',
  register: async (container, options) => {
    container.get('logger').info('Starting Webhook API...')

    return require('./server')(options)
  },
  deregister: async (container) => {
    container.get('logger').info('Stopping Webhook API...')

    return container.get('webhooks-api').stop()
  }
}
