'use strict';

// TODO: ADJUST TO NEW PLUGIN SYSTEM

/* eslint-disable */

const logger = require('@arkecosystem/core-plugin-manager').get('logger')
const config = require('@arkecosystem/core-plugin-manager').get('config')
const ForgerManager = require('@arkecosystem/core-plugin-manager').get('forger')

/**
 * [description]
 * @param  {[type]} config  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
module.exports = async (config, options) => {
  await config.init(config)
  await logger.init(config.server.logging, config.network.name + '-forger')

  const forgerManager = await new ForgerManager(config)
  const forgers = await forgerManager.loadDelegates(options.bip38, options.address, options.password)

  logger.info(`ForgerManager started with ${forgers.length} forgers`)

  forgerManager.startForging(`http://127.0.0.1:${config.server.port}`)
}
