'use strict'
const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const Database = require('./db/postgres')
const env = require('./env')
const { exportTable, importTable, verifyTable } = require('./transport')

module.exports = class SnapshotManager {
  constructor () {
    this.database = new Database()
    this.chunkSize = 50000
  }

  async exportData (options) {
    const params = await this.__init(options)

    await Promise.all([
      exportTable(params.filename, params.queries.blocks, this.database, !!options.filename),
      exportTable('transactions.dat', params.queries.transactions, this.database, !!options.filename)
    ])

    logger.info('Export completed.')
  }

  async importData (options) {
    if (options.truncate) {
      await this.database.truncateChain()
    }
    let lastBlock = await this.database.getLastBlock()

    await Promise.all([
      importTable(options.filename, this.database, lastBlock, options.skipSignVerify),
      importTable('transactions.dat', this.database, lastBlock, options.skipSignVerify)
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

    logger.info(`Verifying snapshot ${options.filename} completed`)
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
      startBlock = (options.start !== -1) ? await this.database.getBlockByHeight(options.start) : { height: 0, timestamp: 0 }
      endBlock = (options.end !== -1) ? await this.database.getBlockByHeight(options.end) : lastBlock
    }

    params.queries = this.database.buildExportQueries(startBlock, endBlock)
    params.filename = `blocks.${startBlock.height}.${endBlock.height}.dat`

    return params
  }
}
