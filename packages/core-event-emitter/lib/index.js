'use strict';

const eventManager = require('./manager')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'event-emitter',
  register: async (manager, options) => eventManager
}
