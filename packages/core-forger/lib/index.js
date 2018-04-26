'use strict';

const ForgerManager = require('./manager')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'forger',
  register: async (manager, options) => {
    const config = manager.get('config')

    const forgerManager = await new ForgerManager(config)

    const forgers = await forgerManager.loadDelegates(options.bip38, options.address, options.password)

    manager.get('logger').info(`ForgerManager started with ${forgers.length} forgers`)

    forgerManager.startForging(`http://127.0.0.1:${config.server.port}`)

    return forgerManager
  }
}
