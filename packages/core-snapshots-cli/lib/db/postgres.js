'use strict'

const promise = require('bluebird')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

module.exports = class Database {
  constructor () {
    try {
      const pgp = require('pg-promise')({promiseLib: promise})
      this.pgp = pgp
      this.db = pgp(container.resolveOptions('database').connection)
    } catch (error) {
      logger.error(`Error while creating and connecting to postgres: ${error}`)
    }

    this.__createColumnSets()
    logger.info('Snapshots: Database connected')
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
      tables.forEach(table => {
        t.none(this.__truncateStatement(table))
      })
    })
  }

  async rollbackCurrentRound () {
    const block = await this.getLastBlock()
    if (block) {
      await this.rollbackChain(block.height)
    }
    return this.getLastBlock()
  }

  async rollbackChain (height) {
    const maxDelegates = container.resolvePlugin('config').getConstants(height).activeDelegates
    const previousRound = Math.floor((height - 1) / maxDelegates)
    const newHeight = previousRound * maxDelegates
    const block = await this.db.oneOrNone(`SELECT ID, TIMESTAMP, HEIGHT FROM BLOCKS WHERE HEIGHT=${newHeight}`)

    logger.debug(`Rolling back chain to last finished round with height ${newHeight}`)
    if (block) {
      await Promise.all([
        this.db.none('TRUNCATE TABLE WALLETS RESTART IDENTITY'),
        this.db.none('TRUNCATE TABLE ROUNDS RESTART IDENTITY'),
        this.db.none(`DELETE FROM TRANSACTIONS WHERE TIMESTAMP > ${block.timestamp}`),
        this.db.none(`DELETE FROM BLOCKS WHERE HEIGHT > ${block.height}`),
        this.db.none(`DELETE FROM ROUNDS WHERE ROUND > ${previousRound}`)
      ])
    }

    return this.getLastBlock()
  }

  buildExportQueries (startBlock, endBlock) {
    return {
      blocks: `SELECT ID, VERSION, TIMESTAMP, PREVIOUS_BLOCK, HEIGHT, NUMBER_OF_TRANSACTIONS, TOTAL_AMOUNT, TOTAL_FEE, REWARD, PAYLOAD_LENGTH, PAYLOAD_HASH, GENERATOR_PUBLIC_KEY, BLOCK_SIGNATURE FROM BLOCKS WHERE HEIGHT BETWEEN ${startBlock.height} AND ${endBlock.height}`,
      transactions: `SELECT id, block_id, version, sequence, timestamp, sender_public_key, recipient_id, type, vendor_field_hex, amount, fee, serialized FROM TRANSACTIONS WHERE TIMESTAMP BETWEEN ${startBlock.timestamp} AND ${endBlock.timestamp}`,
      rounds: 'SELECT * FROM ROUNDS ORDER BY ROUND DESC LIMIT 5100'
    }
  }

  getColumnSet (tableName) {
    switch (tableName) {
      case 'blocks':
        return this.blocksColumnSet
      case 'transactions':
        return this.transactionsColumnSet
      case 'rounds':
        return this.roundsColumnSet
    }
  }

  __truncateStatement (table) {
    return `TRUNCATE TABLE ${table} RESTART IDENTITY`
  }

  __createColumnSets () {
    this.blocksColumnSet = this.pgp.helpers.ColumnSet([
      {
        name: 'id'
      }, {
        name: 'version'
      }, {
        name: 'timestamp'
      }, {
        name: 'previous_block',
        def: null
      }, {
        name: 'height'
      }, {
        name: 'number_of_transactions'
      }, {
        name: 'total_amount',
        init: col => {
          return +col.value.toString()
        }
      }, {
        name: 'total_fee',
        init: col => {
          return +col.value.toString()
        }
      }, {
        name: 'reward',
        init: col => {
          return +col.value.toString()
        }
      }, {
        name: 'payload_length'
      }, {
        name: 'payload_hash'
      }, {
        name: 'generator_public_key'
      }, {
        name: 'block_signature'
      }]
      , {table: 'blocks'}
    )

    this.transactionsColumnSet = new this.pgp.helpers.ColumnSet([
    {
      name: 'id'
    }, {
      name: 'version'
    }, {
      name: 'block_id'
    }, {
      name: 'sequence'
    }, {
      name: 'timestamp'
    }, {
      name: 'sender_public_key'
    }, {
      name: 'recipient_id'
    }, {
      name: 'type'
    }, {
      name: 'vendor_field_hex'
    }, {
      name: 'amount',
      init: col => {
        return +col.value.toString()
      }
    }, {
      name: 'fee',
      init: col => {
        return +col.value.toString()
      }
    }, {
      name: 'serialized'
    }]
    , {table: 'transactions'})

    this.roundsColumnSet = new this.pgp.helpers.ColumnSet([{
      name: 'public_key'
    }, {
      name: 'balance',
      init: col => {
        return +col.value.toString()
      }
    }, {
      name: 'round'
    }]
    , {table: 'rounds'}
    )
  }
}
