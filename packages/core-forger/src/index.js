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
  register: async (hook, config, app) => {
    const forgerManager = await new ForgerManager(app.config)

    const forgers = await forgerManager.loadDelegates(
      app.credentials.bip38, app.credentials.address, app.credentials.password
    )

    logger.info(`ForgerManager started with ${forgers.length} forgers`)

    return forgerManager
  }
}
