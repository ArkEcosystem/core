'use strict'

const promise = require('bluebird')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const queries = require('./queries')

module.exports = class Database {
  constructor () {
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
      tables.forEach(table => t.none(this.__truncateStatement(table)))
    })
  }

  async rollbackChain (height) {
    const maxDelegates = 51
    const currentRound = Math.floor(height / maxDelegates)
    const lastBlockHeight = currentRound * maxDelegates
    const lastRemainingBlock = await this.getBlockByHeight(lastBlockHeight)

    try {
      if (lastRemainingBlock) {
        await Promise.all([
          this.db.none(this.__truncateStatement('wallets')),
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

  /**
  * Used for stream export query stream, where string query is expected.
  */
  async buildExportQueries (startHeight, endHeight) {
    const startBlock = await this.getBlockByHeight(startHeight)
    const endBlock = await this.getBlockByHeight(endHeight)

    if (!startBlock || !endBlock) {
      logger.error('Wrong input height parameters for building export queries. Blocks at height not found in db.')
      process.exit(1)
    }

    return {
      blocks: queries.blocksExportString(startBlock.height, endBlock.height),
      transactions: queries.transactionsExportString(startBlock.timestamp, endBlock.timestamp)
    }
  }

  getColumnSet (tableName) {
    switch (tableName) {
      case 'blocks':
        return this.blocksColumnSet
      case 'transactions':
        return this.transactionsColumnSet
    }
  }

  __truncateStatement (table) {
    return `TRUNCATE TABLE ${table} RESTART IDENTITY`
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
