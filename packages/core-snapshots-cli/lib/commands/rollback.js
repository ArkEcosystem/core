'use strict'

const utils = require('../utils')

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')
const logger = container.resolvePlugin('logger')

module.exports = async (options) => {
  if (!options.height) {
    logger.info('Rollback height is not specified')
    utils.tearDown()
  }

  await database.rollbackChain(options.height)
  const lastBlock = await database.getLastBlock()
  await utils.rollbackCurrentRound(lastBlock.data.height)

  logger.info(`Chain rollback complete to height ${options.height}`)

  utils.tearDown()
}
