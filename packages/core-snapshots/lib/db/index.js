'use strict'

const promise = require('bluebird')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const queries = require('./queries')
const { rawQuery } = require('./utils')
const columns = require('./utils/column-set')

module.exports = class Database {
  constructor (database) {
    if (database) {
      this.db = database.db
      this.pgp = database.pgp
      this.__createColumnSets()
      logger.info('Snapshots: reusing core-database-postgres connection from running core')

      return
    }

    try {
      const pgp = require('pg-promise')({ promiseLib: promise })
      this.pgp = pgp
      this.db = pgp(container.resolveOptions('database').connection)
      this.__createColumnSets()
      logger.info('Snapshots: Database connected')
    } catch (error) {
      container.forceExit('Error while connecting to postgres', error)
    }
  }

  async getLastBlock () {
    return this.db.oneOrNone(queries.blocks.latest)
  }

  async getBlockByHeight (height) {
    return this.db.oneOrNone(queries.blocks.findByHeight, { height })
  }

  async truncateChain () {
    const tables = ['wallets', 'rounds', 'transactions', 'blocks']
    logger.info('Truncating tables: wallets, rounds, transactions, blocks')
    try {
      await this.db.tx('truncate-chain', t => {
        tables.forEach(table => t.none(queries.truncate(table)))
      })
    } catch (error) {
      container.forceExit('Truncate chain error', error)
    }
  }

  async rollbackChain (height) {
    const config = container.resolvePlugin('config')
    const maxDelegates = config.getConstants(height).activeDelegates
    const currentRound = Math.floor(height / maxDelegates)
    const lastBlockHeight = currentRound * maxDelegates
    const lastRemainingBlock = await this.getBlockByHeight(lastBlockHeight)

    try {
      if (lastRemainingBlock) {
        await Promise.all([
          this.db.none(queries.truncate('wallets')),
          this.db.none(queries.transactions.deleteFromTimestamp, { timestamp: lastRemainingBlock.timestamp }),
          this.db.none(queries.blocks.deleteFromHeight, { height: lastRemainingBlock.height }),
          this.db.none(queries.rounds.deleteFromRound, { round: currentRound })
        ])
      }
    } catch (error) {
      logger.error(error)
    }

    return this.getLastBlock()
  }

  async getExportQueries (startHeight, endHeight) {
    const startBlock = await this.getBlockByHeight(startHeight)
    const endBlock = await this.getBlockByHeight(endHeight)

    if (!startBlock || !endBlock) {
      container.forceExit('Wrong input height parameters for building export queries. Blocks at height not found in db.')
    }
    return {
      blocks: rawQuery(this.pgp, queries.blocks.heightRange, { start: startBlock.height, end: endBlock.height }),
      transactions: rawQuery(this.pgp, queries.transactions.timestampRange, { start: startBlock.timestamp, end: endBlock.timestamp })
    }
  }

  getTransactionsBackupQuery (startTimestamp) {
    return rawQuery(this.pgp, queries.transactions.timestampHigher, { start: startTimestamp })
  }

  getColumnSet (tableName) {
    switch (tableName) {
    case 'blocks':
      return this.blocksColumnSet
    case 'transactions':
      return this.transactionsColumnSet
    }
  }

  __createColumnSets () {
    this.blocksColumnSet = new this.pgp.helpers.ColumnSet(columns.blocks, { table: 'blocks' })
    this.transactionsColumnSet = new this.pgp.helpers.ColumnSet(columns.transactions, { table: 'transactions' })
  }
}
