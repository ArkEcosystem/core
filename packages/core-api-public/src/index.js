'use strict';

const logger = require('@arkecosystem/core-plugin-manager').get('logger')
const Server = require('./server')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  register: async (hook, config, app) => {
    logger.info('Starting Public API...')

    await Server(config)
  }
}
