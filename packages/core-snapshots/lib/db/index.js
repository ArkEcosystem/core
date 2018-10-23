'use strict'

const promise = require('bluebird')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const queries = require('./queries')
const { rawQuery } = require('./utils')

module.exports = class Database {
  constructor (db, pgp) {
    if (pgp) {
      this.db = db
      this.pgp = pgp
      return
    }
    try {
      const pgp = require('pg-promise')({ promiseLib: promise })
      this.pgp = pgp
      this.db = pgp(container.resolveOptions('database').connection)
      this.__createColumnSets()
    } catch (error) {
      logger.error(`Error while connecting to postgres: ${error}`)
      process.exit(1)
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

    return this.db.tx('truncate-chain', t => {
      tables.forEach(table => t.none(queries.truncate(table)))
    })
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
      logger.error('Wrong input height parameters for building export queries. Blocks at height not found in db.')
      process.exit(1)
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
    this.blocksColumnSet = this.pgp.helpers.ColumnSet([
      'id', 'version', 'timestamp', 'previous_block', 'height', 'number_of_transactions', 'total_amount', 'total_fee', 'reward', 'payload_length', 'payload_hash', 'generator_public_key', 'block_signature'], { table: 'blocks' }
    )

    this.transactionsColumnSet = new this.pgp.helpers.ColumnSet([
      'id', 'version', 'block_id', 'sequence', 'timestamp', 'sender_public_key', 'recipient_id', 'type', 'vendor_field_hex', 'amount', 'fee', 'serialized'], { table: 'transactions' }
    )
  }
}
