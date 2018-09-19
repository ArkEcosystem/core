'use strict'

const utils = require('../utils')
const env = require('../env')

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')
const logger = container.resolvePlugin('logger')

module.exports = async (options) => {
  if (!options.height) {
    logger.warn('Rollback height is not specified')
    env.tearDown()
  }

  logger.info(`Starting the process of rolling back chain to block height of ${options.filename}`)
  await database.rollbackChain(parseInt(options.height))
  const lastActiveBlock = await utils.rollbackCurrentRound(await database.getLastBlock())

  logger.info(`Chain rollback complete to height ${lastActiveBlock}`)

  await env.tearDown()
}
