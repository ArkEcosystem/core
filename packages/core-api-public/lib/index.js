'use strict';

const Server = require('./server')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  register: async (manager, options) => {
    manager.get('logger').info('Starting Public API...')

    await Server(options)
  }
}
