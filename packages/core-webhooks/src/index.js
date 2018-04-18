'use strict';

const logger = require('@arkecosystem/core-plugin-manager').get('logger')
const Manager = require('./manager')
const database = require('./database')

/**
 * [plugin description]
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults.json'),
  alias: 'webhooks',
  register: async (hook, config, app) => {
    logger.info('Starting Webhooks...')

    await database.init(config.database)

    const manager = new Manager(config)

    await manager.init(config)

    return Manager.getInstance()
  },
  bindings: {
    webhookDB: database
  }
}
