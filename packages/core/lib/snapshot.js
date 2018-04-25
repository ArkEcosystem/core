'use strict';

// TODO: ADJUST TO NEW PLUGIN SYSTEM

/* eslint-disable */

const expandHomeDir = require('expand-home-dir')

const pluginManager = require('@arkecosystem/core-plugin-manager')
const config = pluginManager.get('config')
const DB = pluginManager.get('database')
const logger = pluginManager.get('logger')

/**
 * [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
module.exports = async (options) => {
  await config.init(options.conig)

  logger.init(config.server.logging, config.network.name)

  const db = await DB.create(config.server.database)
  db.snapshot(expandHomeDir(config.server.database.snapshots))

  logger.info('Snapshot saved')
}
