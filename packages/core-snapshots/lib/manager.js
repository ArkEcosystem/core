'use strict'
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const Database = require('./db')
const utils = require('./utils')
const { exportTable, importTable, verifyTable, backupTransactionsToJSON } = require('./transport')
const { blockCodec, transactionCodec } = require('./transport/codec')

module.exports = class SnapshotManager {
  constructor (db, pgp) {
    this.database = new Database(db, pgp)
  }

  async exportData (options) {
    const params = await this.__init(options)
    // TODO: simplify params
    await Promise.all([
      exportTable(
        `blocks.${params.meta.stringInfo}`,
        params.queries.blocks,
        this.database,
        this.__selectCodec('blocks', options.ignoreCodec),
        !!options.filename),

      exportTable(
        `transactions.${params.meta.stringInfo}`,
        params.queries.transactions,
        this.database,
        this.__selectCodec('transactions', options.ignoreCodec),
        !!options.filename)
    ])

    logger.info('Export completed.')
  }

  async importData (options) {
    if (options.truncate) {
      await this.database.truncateChain()
    }
    let lastBlock = await this.database.getLastBlock()
    const fileMeta = utils.getSnapshotInfo(options.filename)

    await importTable(`blocks.${fileMeta.stringInfo}`, this.database, this.__selectCodec('blocks', options.ignoreCodec), lastBlock, options.signatureVerify)
    await importTable(`transactions.${fileMeta.stringInfo}`, this.database, this.__selectCodec('transactions', options.ignoreCodec), lastBlock, options.signatureVerify)

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
      verifyTable(`blocks.${fileMeta.stringInfo}`, this.database, options.signatureVerify),
      verifyTable(`transactions.${fileMeta.stringInfo}`, this.database, options.signatureVerify)
    ])

    logger.info('Verifying of snapshot completed with success :100:')
  }

  async rollbackChain (height) {
    const lastBlock = await this.database.getLastBlock()
    const config = container.resolvePlugin('config')
    const maxDelegates = config.getConstants(lastBlock.height).activeDelegates

    const rollBackHeight = height === -1 ? lastBlock.height : height
    if (rollBackHeight >= lastBlock.height || rollBackHeight < 1) {
      logger.error(`Specified rollback block height: ${rollBackHeight} is not valid. Current database height: ${lastBlock.height}. Exiting.`)
      process.exit(1)
    }

    if (height) {
      const rollBackBlock = await this.database.getBlockByHeight(rollBackHeight)
      const qTransactionBackup = await this.database.getTransactionsBackupQuery(rollBackBlock.timestamp)
      await backupTransactionsToJSON(`rollbackTransactionBackup.${(+height + 1)}.${lastBlock.height}.json`, qTransactionBackup, this.database)
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

  __selectCodec (tableName, ignore) {
    if (ignore) {
      console.log('no codec')
      return null
    }
    if (tableName === 'blocks') {
      return blockCodec()
    }
    if (tableName === 'transactions') {
      return transactionCodec()
    }
  }
}
