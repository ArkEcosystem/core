'use strict'

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'webhooks-api',
  register: async (manager, options) => {
    manager.get('logger').info('Starting Webhook API...')

    return require('./server')(options)
  },
  deregister: async (manager) => {
    manager.get('logger').info('Stopping Webhook API...')

    return manager.get('webhooks-api').stop()
  }
}
