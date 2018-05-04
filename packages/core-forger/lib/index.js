'use strict'

const ForgerManager = require('./manager')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'forger',
  register: async (container, options) => {
    const config = container.resolvePlugin('config')

    const forgerManager = await new ForgerManager(config)

    const forgers = await forgerManager.loadDelegates(options.bip38, options.address, options.password)

    container.resolvePlugin('logger').info(`ForgerManager started with ${forgers.length} forgers`)

    forgerManager.startForging(`http://127.0.0.1:${config.server.port}`)

    return forgerManager
  }
}
