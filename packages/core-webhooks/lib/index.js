'use strict';

const WebhookManager = require('./manager')
const database = require('./database')

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'webhooks',
  register: async (manager, options) => {
    manager.get('logger').info('Starting Webhooks...')

    await database.init(options.database)

    const webhookManager = new WebhookManager(options)
    await webhookManager.init(options)

    return WebhookManager.getInstance()
  }
}

exports.database = database
