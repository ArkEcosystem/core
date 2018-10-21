'use strict'
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const Database = require('./db')
const utils = require('./utils')
const { exportTable, importTable, verifyTable, backupTransactionsToJSON } = require('./transport')

module.exports = class SnapshotManager {
  constructor () {
    this.database = new Database()
    this.chunkSize = 50000
  }

  async exportData (options) {
    const params = await this.__init(options)

    await Promise.all([
      exportTable(`blocks.${params.meta.stringInfo}`, params.queries.blocks, this.database, !!options.filename),
      exportTable(`transactions.${params.meta.stringInfo}`, params.queries.transactions, this.database, !!options.filename)
    ])

    logger.info('Export completed.')
  }

  async importData (options) {
    if (options.truncate) {
      await this.database.truncateChain()
    }
    let lastBlock = await this.database.getLastBlock()
    const fileMeta = utils.getSnapshotInfo(options.filename)

    await Promise.all([
      importTable(`blocks.${fileMeta.stringInfo}`, this.database, lastBlock, options.skipSignVerify),
      importTable(`transactions.${fileMeta.stringInfo}`, this.database, lastBlock, options.skipSignVerify)
    ])

    lastBlock = await this.database.getLastBlock()

    logger.info(`Import from ${options.filename} completed. Last block in database: ${lastBlock.height}`)

    const newLastBlock = await this.database.rollbackChain(lastBlock.height)
    logger.info(`Rollback performed to last completed round ${newLastBlock.height / 51} completed. Last block in database: ${newLastBlock.height}`)
  }

  async verifyData (options) {
    if (options.truncate) {
      await this.database.truncateChain()
    }
    const fileMeta = utils.getSnapshotInfo(options.filename)

    await Promise.all([
      verifyTable(`blocks.${fileMeta.stringInfo}`, this.database, options.skipSignVerify),
      verifyTable(`transactions.${fileMeta.stringInfo}`, this.database, options.skipSignVerify)
    ])

    logger.info('Verifying of snapshot completed with success :100:')
  }

  async rollbackChain (options) {
    const lastBlock = await this.database.getLastBlock()
    const rollBackHeight = options.height === -1 ? lastBlock.height : options.height

    if (options.height) {
      const queries = await this.database.buildExportQueries(+options.height + 1, lastBlock.height)
      await backupTransactionsToJSON(`rollbackTransactionBackup.${(+options.height + 1)}.${lastBlock.height}.json`, queries.transactions, this.database)
    }

    const newLastBlock = await this.database.rollbackChain(rollBackHeight)
    logger.info(`Rolling back chain to last finished round ${newLastBlock.height / 51} with last block height ${newLastBlock.height}`)
  }

  async truncateChain () {
    return this.database.truncateChain()
  }

  async __init (options) {
    const lastBlock = await this.database.getLastBlock()
    let params = {}
    params.meta = utils.setSnapshotInfo(options, lastBlock)

    if (options.filename) {
      utils.copySnapshot(utils.getSnapshotInfo(options.filename).stringInfo, params.meta.stringInfo)
    }
    params.queries = await this.database.buildExportQueries(params.meta.startHeight, params.meta.endHeight)

    console.log(params)
    return params
  }
}
