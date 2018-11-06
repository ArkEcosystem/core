'use strict'

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = require('./db')
const utils = require('./utils')
const { exportTable, importTable, verifyTable, backupTransactionsToJSON } = require('./transport')
const pick = require('lodash/pick')

module.exports = class SnapshotManager {
  constructor (options) {
    this.options = options
  }

  async make (connection) {
    this.database = await database.make(connection)

    return this
  }

  async exportData (options) {
    const params = await this.__init(options, true)

    if (params.skipExportWhenNoChange) {
      logger.info(`Skipping export of snapshot, because ${params.meta.folder} is already up to date.`)
      return
    }

    const metaInfo = {
      blocks: await exportTable('blocks', params),
      transactions: await exportTable('transactions', params),
      folder: params.meta.folder,
      codec: options.codec,
      skipCompression: params.meta.skipCompression
    }

    utils.writeMetaFile(metaInfo)
    this.database.close()
  }

  async importData (options) {
    const params = await this.__init(options)

    if (params.truncate) {
      params.lastBlock = await this.database.truncateChain()
    }

    await importTable('blocks', params)
    await importTable('transactions', params)

    const lastBlock = await this.database.getLastBlock()
    logger.info(`Import from folder ${params.meta.folder} completed. Last block in database: ${lastBlock.height} :+1:`)
    if (!params.skipRestartRound) {
      const newLastBlock = await this.database.rollbackChain(lastBlock.height)
      logger.info(`Rolling back chain to last finished round with last block height ${newLastBlock.height}`)
    }

    this.database.close()
  }

  async verifyData (options) {
    const params = await this.__init(options)

    await Promise.all([
      verifyTable('blocks', params),
      verifyTable('transactions', params)
    ])
  }

  async truncateChain () {
    await this.database.truncateChain()

    this.database.close()
  }

  async rollbackChain (height) {
    const lastBlock = await this.database.getLastBlock()
    const config = container.resolvePlugin('config')
    const maxDelegates = config.getConstants(lastBlock.height).activeDelegates

    const rollBackHeight = height === -1 ? lastBlock.height : height
    if (rollBackHeight >= lastBlock.height || rollBackHeight < 1) {
      container.forceExit(`Specified rollback block height: ${rollBackHeight} is not valid. Current database height: ${lastBlock.height}. Exiting.`)
    }

    if (height) {
      const rollBackBlock = await this.database.getBlockByHeight(rollBackHeight)
      const qTransactionBackup = await this.database.getTransactionsBackupQuery(rollBackBlock.timestamp)
      await backupTransactionsToJSON(`rollbackTransactionBackup.${(+height + 1)}.${lastBlock.height}.json`, qTransactionBackup, this.database)
    }

    const newLastBlock = await this.database.rollbackChain(rollBackHeight)
    logger.info(`Rolling back chain to last finished round ${newLastBlock.height / maxDelegates} with last block height ${newLastBlock.height}`)

    this.database.close()
  }

  /**
   * Inits the process and creates json with needed paramaters for functions
   * @param  {JSONObject} from commander or util function {blocks, codec, truncate, signatureVerify, skipRestartRound, start, end}
   * @return {JSONObject} with merged parameters, adding {lastBlock, database, meta {startHeight, endHeight, folder}, queries {blocks, transactions}}
   */
  async __init (options, exportAction = false) {
    let params = pick(options, ['truncate', 'signatureVerify', 'blocks', 'codec', 'skipRestartRound', 'start', 'end', 'skipCompression'])

    const lastBlock = await this.database.getLastBlock()
    params.lastBlock = lastBlock
    params.codec = params.codec || this.options.codec
    params.chunkSize = this.options.chunkSize || 50000

    if (exportAction) {
      if (!lastBlock) {
        container.forceExit('Database is empty. Export not possible.')
      }
      params.meta = utils.setSnapshotInfo(params, lastBlock)
      params.queries = await this.database.getExportQueries(params.meta.startHeight, params.meta.endHeight)

      if (params.blocks) {
        if (options.blocks === params.meta.folder) {
          params.skipExportWhenNoChange = true
          return params
        }
        const sourceSnapshotParams = utils.readMetaJSON(params.blocks)
        params.meta.skipCompression = sourceSnapshotParams.skipCompression
        params.meta.startHeight = sourceSnapshotParams.blocks.startHeight
        utils.copySnapshot(options.blocks, params.meta.folder, params.codec)
      }
    } else {
      params.meta = utils.getSnapshotInfo(options.blocks)
    }
    if (options.trace) {
      console.log(params.meta)
      console.log(params.queries)
    }
    params.database = this.database
    return params
  }
}
