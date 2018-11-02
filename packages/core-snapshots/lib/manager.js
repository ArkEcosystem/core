'use strict'

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const delay = require('delay')

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

    const metaInfo = {
      blocks: await exportTable('blocks', params),
      transactions: await exportTable('transactions', params),
      folder: params.meta.folder,
      codec: options.codec
    }

    utils.writeMetaFile(metaInfo)
  }

  async importData (options) {
    const params = await this.__init(options)
    if (params.truncate) {
      await this.database.truncateChain()
      await delay(1000)
    }

    await importTable('blocks', params)
    await importTable('transactions', params)

    const lastBlock = await this.database.getLastBlock()
    logger.info(`Import from folder ${params.meta.folder} completed. Last block in database: ${lastBlock.height} :+1:`)

    if (!params.skipRestartRound) {
      const newLastBlock = await this.database.rollbackChain(lastBlock.height)
      logger.info(`Rolling back chain to last finished round with last block height ${newLastBlock.height}`)
    }
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
      container.forceExit(`Specified rollback block height: ${rollBackHeight} is not valid. Current database height: ${lastBlock.height}. Exiting.`)
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
   * @param  {JSONObject} from commander or util function {blocks, codec, truncate, signatureVerify, skipRestartRound, start, end}
   * @return {JSONObject} with merged parameters, adding {lastBlock, database, meta {startHeight, endHeight, folder}, queries {blocks, transactions}}
   */
  async __init (options, exportAction = false) {
    let params = pick(options, ['truncate', 'signatureVerify', 'blocks', 'codec', 'skipRestartRound', 'start', 'end'])

    const lastBlock = await this.database.getLastBlock()
    params.lastBlock = lastBlock
    params.codec = params.codec || this.options.codec

    if (exportAction) {
      params.meta = utils.setSnapshotInfo(params, lastBlock)
      if (params.blocks) {
        utils.copySnapshot(options.blocks, params.meta.folder, params.codec)
      }
      params.queries = await this.database.getExportQueries(params.meta.startHeight, params.meta.endHeight)
    } else {
      params.meta = utils.getSnapshotInfo(options.blocks)
    }
    if (options.trace) {
      console.log(params)
    }
    params.database = this.database
    return params
  }
}
