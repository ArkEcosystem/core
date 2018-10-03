'use strict'
const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const Database = require('./db/postgres')
const env = require('./env')
const {exportTable, importTable} = require('./transport')

module.exports = class SnapshotManager {
  constructor () {
    this.database = new Database()
    this.chunkSize = 50000
  }

  async exportData (options) {
    const params = await this.__init(options)

    await Promise.all([
      exportTable(params.filename, params.queries.blocks, this.database, !!options.filename),
      exportTable('transactions.dat', params.queries.transactions, this.database, !!options.filename),
      exportTable('rounds.dat', params.queries.rounds, this.database)
    ])

    logger.debug('Export completed.')
  }

  async importData (options) {
    if (options.truncate) {
      await this.database.truncateChain()
    }

    await Promise.all([
      importTable(options.filename, this.database),
      importTable('transactions.dat', this.database),
      importTable('rounds.dat', this.database)
    ])

    logger.debug(`Import from ${options.filename} completed`)
    await this.database.rollbackCurrentRound()
  }

  async rollbackChain (options) {
    await this.database.rollbackChain(options.height)
  }

  async truncateChain () {
    return this.database.truncateChain()
  }

  async __init (options) {
    let params = {}
    const lastBlock = await this.database.getLastBlock()
    if (!lastBlock) {
      logger.debug('Empty database. Exiting.')
      process.exit(1)
    }

    if (options.filename && !fs.existsSync(env.getPath(options.filename))) {
      logger.error(`Appending not possible. Existing snapshot ${this.options.filename} not found. Exiting...`)
      process.exit(1)
    }

    let startBlock = {}
    let endBlock = {}
    if (options.filename) {
      const metaData = this.options.filename.split('.')
      startBlock = await this.database.getBlockByHeight(+metaData[1])
      endBlock = await this.database.getBlockByHeight(+metaData[2])
    } else {
      startBlock = (options.start !== -1) ? await this.database.getBlockByHeight(options.start) : {height: 0, timestamp: 0}
      endBlock = (options.end !== -1) ? await this.database.getBlockByHeight(options.end) : lastBlock
    }

    params.queries = this.database.buildExportQueries(startBlock, endBlock)
    params.filename = `blocks.${startBlock.height}.${endBlock.height}.dat`

    return params
  }
}
