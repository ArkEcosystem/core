'use strict'

const Blockchain = require('./blockchain')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'blockchain',
  register: async (manager, options) => new Blockchain(manager.get('config'), options.networkStart)
}
