'use strict';

const logger = require('@arkecosystem/core-plugin-manager').get('logger')
const winston = require('./logger')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  register: async (hook, config, app) => {
    const instance = await winston.init(config)

    await logger.setDriver(instance)
  }
}
