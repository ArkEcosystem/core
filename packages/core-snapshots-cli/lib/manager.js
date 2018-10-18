'use strict'
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const Database = require('./db/postgres')
const utils = require('./utils')
const { exportTable, importTable, verifyTable } = require('./transport')

module.exports = class SnapshotManager {
  constructor () {
    this.database = new Database()
    this.chunkSize = 50000
  }

  async exportData (options) {
    const params = await this.__init(options)

    await Promise.all([
      exportTable(`blocks.${params.meta.startHeight}.${params.meta.endHeight}`, params.queries.blocks, this.database, !!options.filename),
      exportTable(`transactions.${params.meta.startHeight}.${params.meta.endHeight}`, params.queries.transactions, this.database, !!options.filename)
    ])

    logger.info('Export completed.')
  }

  async importData (options) {
    if (options.truncate) {
      await this.database.truncateChain()
    }
    let lastBlock = await this.database.getLastBlock()

    await Promise.all([
      importTable(`${options.filename}`, this.database, lastBlock, options.skipSignVerify),
      importTable(`transactions.${options.filename.split('.').slice(1).join('.')}`, this.database, lastBlock, options.skipSignVerify)
    ])

    lastBlock = await this.database.getLastBlock()

    logger.info(`Import from ${options.filename} completed. Last Block in database: ${lastBlock.height}`)

    const newLastBlock = await this.database.rollbackChain(lastBlock.height)
    logger.info(`Rollback performed to last completed round ${newLastBlock.height / 51} completed. Last Block in database: ${newLastBlock.height}`)
  }

  async verifyData (options) {
    if (options.truncate) {
      await this.database.truncateChain()
    }

    await Promise.all([
      verifyTable(options.filename, this.database, options.skipSignVerify),
      verifyTable('transactions.dat', this.database, options.skipSignVerify)
    ])

    logger.info(`Verifying of snapshot ${options.filename} completed with success :100:.`)
  }

  async rollbackChain (options) {
    const lastBlock = await this.database.getLastBlock()
    const rollBackHeight = options.height === -1 ? lastBlock.height : options.height

    const newLastBlock = await this.database.rollbackChain(rollBackHeight)
    logger.info(`Rolling back chain to last finished round ${newLastBlock.height / 51} with last block height ${newLastBlock.height}`)
  }

  async truncateChain () {
    return this.database.truncateChain()
  }

  async __init (options) {
    const lastBlock = await this.database.getLastBlock()
    let params = {
      meta: {
        startHeight: (options.start !== -1) ? options.start : 1,
        endHeight: (options.end !== -1) ? options.end : lastBlock.height
      }
    }

    if (options.filename) {
      params.meta.startHeight = +(options.filename.split('.')[2]) + 1

      utils.copySnapshot(options.filename, params.meta.endHeight)
    }

    params.queries = await this.database.buildExportQueries(params.meta.startHeight, params.meta.endHeight)

    console.log(params)
    return params
  }
}
