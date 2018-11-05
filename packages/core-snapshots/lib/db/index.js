'use strict'

const promise = require('bluebird')
const { migrations } = require('@arkecosystem/core-database-postgres')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const queries = require('./queries')
const { rawQuery } = require('./utils')
const columns = require('./utils/column-set')

class Database {
  async make (database) {
    if (database) {
      this.db = database.db
      this.pgp = database.pgp
      this.__createColumnSets()
      this.isSharedConnection = true
      logger.info('Snapshots: reusing core-database-postgres connection from running core')
      return this
    }

    try {
      const pgp = require('pg-promise')({ promiseLib: promise })
      this.pgp = pgp
      const options = container.resolveOptions('database').connection
      options.idleTimeoutMillis = 100
      this.db = pgp(options)
      this.__createColumnSets()
      await this.__runMigrations()
      logger.info('Snapshots: Database connected')
      this.isSharedConnection = false
      return this
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
      for (const table of tables) {
        await this.db.none(queries.truncate(table))
      }

      return this.getLastBlock()
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

  close () {
    if (!this.isSharedConnection) {
      logger.debug('Closing snapshots-cli database connection')
      this.db.$pool.end()
      this.pgp.end()
    }
  }

  __createColumnSets () {
    this.blocksColumnSet = new this.pgp.helpers.ColumnSet(columns.blocks, { table: 'blocks' })
    this.transactionsColumnSet = new this.pgp.helpers.ColumnSet(columns.transactions, { table: 'transactions' })
  }

  async __runMigrations () {
    for (const migration of migrations) {
      await this.db.none(migration)
    }
  }
}

module.exports = new Database()
