'use strict'

const ForgerManager = require('./manager')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'forger',
  async register (container, options) {
    const forgerManager = new ForgerManager(options)
    const forgers = await forgerManager.loadDelegates(options.bip38, options.password)

    if (!forgers) {
      container.resolvePlugin('logger').info('Forger is disabled :grey_exclamation:')
      return
    }

    // Don't keep bip38 password in memory
    delete process.env.ARK_FORGER_PASSWORD
    delete options.password

    container.resolvePlugin('logger').info(`ForgerManager started with ${forgers.length} forgers`)

    forgerManager.startForging()

    return forgerManager
  },
  async deregister (container, options) {
    const forger = container.resolvePlugin('forger')

    if (forger) {
      container.resolvePlugin('logger').info('Stopping Forger Manager')

      return forger.stop()
    }
  }
}
