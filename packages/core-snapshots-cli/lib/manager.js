'use strict'
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const Database = require('./db')
const utils = require('./utils')
const { exportTable, importTable, verifyTable, backupTransactionsToJSON } = require('./transport')

class SnapshotManager {
  constructor () {
    this.database = new Database()
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

    if (!options.skipRestartRound) {
      const newLastBlock = await this.database.rollbackChain(lastBlock.height)
      logger.info(`Rollback performed to last completed round ${newLastBlock.height / 51} completed. Last block in database: ${newLastBlock.height}`)
    }
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
    const config = container.resolvePlugin('config')
    const maxDelegates = config.getConstants(lastBlock.height).activeDelegates

    const rollBackHeight = options.height === -1 ? lastBlock.height : options.height
    if (rollBackHeight >= lastBlock.height || rollBackHeight < 1) {
      logger.error(`Specified rollback block height: ${rollBackHeight} is not valid. Current database height: ${lastBlock.height}. Exiting.`)
      process.exit(1)
    }

    if (options.height) {
      const rollBackBlock = await this.database.getBlockByHeight(rollBackHeight)
      const qTransactionBackup = await this.database.getTransactionsBackupQuery(rollBackBlock.timestamp)
      await backupTransactionsToJSON(`rollbackTransactionBackup.${(+options.height + 1)}.${lastBlock.height}.json`, qTransactionBackup, this.database)
    }

    const newLastBlock = await this.database.rollbackChain(rollBackHeight)
    logger.info(`Rolling back chain to last finished round ${newLastBlock.height / maxDelegates} with last block height ${newLastBlock.height}`)
  }

  async __init (options) {
    const lastBlock = await this.database.getLastBlock()
    let params = {}
    params.meta = utils.setSnapshotInfo(options, lastBlock)

    if (options.filename) {
      utils.copySnapshot(utils.getSnapshotInfo(options.filename).stringInfo, params.meta.stringInfo)
    }
    params.queries = await this.database.getExportQueries(params.meta.startHeight, params.meta.endHeight)

    console.log(params)
    return params
  }
}

module.exports = new SnapshotManager()
