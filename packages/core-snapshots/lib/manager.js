'use strict'
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')
const delay = require('delay')

const Database = require('./db')
const utils = require('./utils')
const { exportTable, importTable, verifyTable, backupTransactionsToJSON } = require('./transport')
const pick = require('lodash/pick')

module.exports = class SnapshotManager {
  constructor (db, pgp) {
    this.database = new Database(db, pgp)
  }

  async exportData (options) {
    const params = await this.__init(options, true)

    await Promise.all([
      exportTable('blocks', params),
      exportTable('transactions', params)
    ])
  }

  async importData (options) {
    const params = await this.__init(options)
    if (params.truncate) {
      await this.database.truncateChain()
      await delay(1000)
    }

    await importTable('blocks', params)
    await importTable('transactions', params)

    let results = []
    emitter.on('import:table:done', async (data) => {
      logger.info(`Importing from ${data} completed :+1:`)
      results.push(data)

      if (results.length === 2) {
        const lastBlock = await this.database.getLastBlock()
        logger.info(`Import from ${params.filename} completed. Last block in database: ${lastBlock.height}`)
        if (!params.skipRestartRound) {
          const newLastBlock = await this.database.rollbackChain(lastBlock.height)
          logger.info(`Rolling back chain to last finished round with last block height ${newLastBlock.height}`)
        }

        emitter.emit('import:complete', results)
      }
    })
  }

  async verifyData (options) {
    const params = await this.__init(options)

    await Promise.all([
      verifyTable('blocks', params),
      verifyTable('transactions', params)
    ])
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

  /**
   * Inits the process and creates json with needed paramaters for functions
   * @param  {JSONObject} from commander or util function {filename, codec, truncate, signatureVerify, skipRestartRound, start, end}
   * @return {JSONObject} with merged parameters, adding {lastBlock, database, meta {startHeight, endHeight, strinInfo}, queries {blocks, transactions}}
   */
  async __init (options, exportAction = false) {
    let params = pick(options, ['truncate', 'signatureVerify', 'filename', 'codec', 'skipRestartRound'])

    const lastBlock = await this.database.getLastBlock()
    params.lastBlock = lastBlock
    params.database = this.database

    if (exportAction) {
      params.meta = utils.setSnapshotInfo(options, lastBlock)
      if (params.filename) {
        utils.copySnapshot(utils.getSnapshotInfo(options.filename).stringInfo, params.meta.stringInfo)
      }
      params.queries = await this.database.getExportQueries(params.meta.startHeight, params.meta.endHeight)
    } else {
      params.meta = utils.getSnapshotInfo(options.filename, lastBlock)
    }

    console.log(params.meta)
    console.log(params.queries)
    console.log(options.codec)
    return params
  }
}
