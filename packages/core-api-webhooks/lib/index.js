'use strict';

const Server = require('./server')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  register: async (manager, options) => {
    manager.get('logger').info('Starting Webhook API...')

    await Server(options)
  }
}
