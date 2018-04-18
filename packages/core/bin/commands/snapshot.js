'use strict';

// TODO: ADJUST TO NEW PLUGIN SYSTEM

/* eslint-disable */

const expandHomeDir = require('expand-home-dir')

const config = require('@arkecosystem/core-plugin-manager').get('config')
const DB = require('@arkecosystem/core-plugin-manager').get('database')
const logger = require('@arkecosystem/core-plugin-manager').get('logger')

/**
 * [description]
 * @param  {[type]} config  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
module.exports = async (config, options) => {
  await config.init(conig)

  logger.init(config.server.logging, config.network.name)

  const db = await DB.create(config.server.database)
  db.snapshot(expandHomeDir(config.server.database.snapshots))

  logger.info('Snapshot saved')
}
