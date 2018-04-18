'use strict';

const Server = require('./server')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  register: async (manager, options) => {
    manager.get('logger').info('Starting Webhook API...')

    await Server(options)
  }
}
