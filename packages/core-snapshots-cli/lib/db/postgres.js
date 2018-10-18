'use strict'

const promise = require('bluebird')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

module.exports = class Database {
  constructor () {
    try {
      const pgp = require('pg-promise')({ promiseLib: promise })
      this.pgp = pgp
      this.db = pgp(container.resolveOptions('database').connection)
    } catch (error) {
      logger.error(`Error while creating and connecting to postgres: ${error}`)
      process.exit(1)
    }

    this.__createColumnSets()
  }

  async getLastBlock () {
    return this.db.oneOrNone('SELECT * FROM blocks ORDER BY height DESC LIMIT 1')
  }

  async getBlockByHeight (height) {
    return this.db.oneOrNone(`SELECT id, height, timestamp FROM blocks WHERE height = ${height}`)
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

    if (lastRemainingBlock) {
      await Promise.all([
        this.db.none(this.__truncateStatement('wallets')),
        this.db.none(`DELETE FROM TRANSACTIONS WHERE TIMESTAMP > ${lastRemainingBlock.timestamp}`),
        this.db.none(`DELETE FROM BLOCKS WHERE HEIGHT > ${lastRemainingBlock.height}`),
        this.db.none(`DELETE FROM ROUNDS WHERE ROUND > ${currentRound}`)
      ])
    }

    return this.getLastBlock()
  }

  async buildExportQueries (startHeight, endHeight) {
    const startBlock = await this.getBlockByHeight(startHeight)
    const endBlock = await this.getBlockByHeight(endHeight)

    if (!startBlock || !endBlock) {
      logger.error('Wrong input height parameters for building export queries. Blocks at height not found in db.')
      process.exit(1)
    }

    return {
      blocks: `SELECT id, version, timestamp, previous_block, height, number_of_transactions, total_amount, total_fee, reward, payload_length, payload_hash, generator_public_key, block_signature FROM BLOCKS WHERE HEIGHT BETWEEN ${startBlock.height} AND ${endBlock.height} ORDER BY HEIGHT`,
      transactions: `SELECT id, block_id, version, sequence, timestamp, sender_public_key, recipient_id, type, vendor_field_hex, amount, fee, serialized from TRANSACTIONS WHERE TIMESTAMP BETWEEN ${startBlock.timestamp} AND ${endBlock.timestamp} ORDER BY TIMESTAMP`
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
