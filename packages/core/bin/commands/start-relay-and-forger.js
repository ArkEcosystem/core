'use strict';

// TODO: ADJUST TO NEW PLUGIN SYSTEM

/* eslint-disable */

const logger = require('@arkecosystem/core-plugin-manager').get('logger')
const config = require('@arkecosystem/core-plugin-manager').get('config')
const DB = require('@arkecosystem/core-plugin-manager').get('database')
const PublicAPI = require('@arkecosystem/core-api-public')
const WebhookManager = require('@arkecosystem/core-plugin-manager').get('webhooks')
const BlockchainManager = require('@arkecosystem/core-plugin-manager').get('blockchain')
const ForgerManager = require('@arkecosystem/core-plugin-manager').get('forger')

const TransactionHandler = require('../src/transaction-handler')

/**
 * [description]
 * @param  {[type]} config  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
module.exports = async (config, options) => {
  await config.init(config)
  await logger.init(config.server.logging, config.network.name)

  const blockchainManager = await new BlockchainManager(config, options.networkStart)

  logger.info('Starting Dependencies...')
  await DependencyHandler.checkDatabaseLibraries(config)

  logger.info('Starting Webhook Manager...')
  await new WebhookManager(config.webhooks).init()

  logger.info('Starting Database Interface...')
  const db = await DB.create(config.server.database)
  await blockchainManager.setDatabaseManager(db)

  logger.info('Starting P2P Interface...')
  const p2p = new P2PInterface(config)
  await p2p.warmup(options.networkStart)
  await blockchainManager.setNetworkInterface(p2p)

  logger.info('Starting Transaction Pool...')
  const txHandler = await new TransactionHandler(config)
  await blockchainManager.setTransactionHandler(txHandler)

  logger.info('Starting Blockchain Manager...')
  await blockchainManager.start()
  await blockchainManager.isReady()

  logger.info('Starting Public API...')
  await PublicAPI(config)

  logger.info('Starting Forger...')
  const forgerManager = await new ForgerManager(config)
  const forgers = await forgerManager.loadDelegates(options.bip38, options.address, options.password)

  logger.info(`ForgerManager started with ${forgers.length} forgers`)
  forgerManager.startForging(`http://127.0.0.1:${config.server.port}`)
}
