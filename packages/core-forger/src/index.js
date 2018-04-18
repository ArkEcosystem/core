'use strict';

const ForgerManager = require('./manager')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'forger',
  register: async (manager, options) => {
    const forgerManager = await new ForgerManager(manager.get('config'))

    // TODO: pass in credentials via options
    const forgers = await forgerManager.loadDelegates(options.bip38, options.address, options.password)

    manager.get('logger').info(`ForgerManager started with ${forgers.length} forgers`)

    return forgerManager
  }
}
