'use strict';

const logger = require('@arkecosystem/core-plugin-manager').get('logger')
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

    const forgers = await forgerManager.loadDelegates(
      app.credentials.bip38, app.credentials.address, app.credentials.password
    )

    manager.get('logger').info(`ForgerManager started with ${forgers.length} forgers`)

    return forgerManager
  }
}
