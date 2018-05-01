'use strict';

const emitter = require('./emitter')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'event-emitter',
  register: async (manager, options) => emitter
}
