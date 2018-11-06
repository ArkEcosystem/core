'use strict'

const { first, last } = require('lodash')
const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')
const logger = container.resolvePlugin('logger')
const { Transaction } = require('@arkecosystem/crypto').models
const Index = require('./index')
const client = require('../services/client')
const storage = require('../services/storage')

class TransactionIndex extends Index {
  /**
   * Index transactions using the specified chunk size.
   * @return {void}
   */
  async index () {
    const { count } = await this.__count()

    const queries = Math.ceil(count / this.chunkSize)

    for (let i = 0; i < queries; i++) {
      const modelQuery = this.__createQuery()

      const query = modelQuery
        .select(modelQuery.block_id, modelQuery.serialized)
        .from(modelQuery)
        .where(modelQuery.timestamp.gte(storage.get('history', 'lastTransaction')))
        .order(modelQuery.timestamp.asc)
        .limit(this.chunkSize)
        .offset(this.chunkSize * i)

      let rows = await database.query.manyOrNone(query.toQuery())

      if (!rows.length) {
        continue
      }

      rows = rows.map(row => {
        const transaction = new Transaction(row.serialized.toString('hex'))
        transaction.blockId = row.blockId

        return transaction
      })

      const blockIds = rows.map(row => row.blockId)
      logger.info(`[Elasticsearch] Indexing transactions from block ${first(blockIds)} to ${last(blockIds)} :card_index_dividers:`)

      try {
        await client.bulk(this._buildBulkUpsert(rows))

        storage.update('history', {
          lastTransaction: last(rows.map(row => row.timestamp))
        })
      } catch (error) {
        logger.error(`[Elasticsearch] ${error.message} :exclamation:`)
      }
    }
  }

  /**
   * Register listeners for "transaction.*" events.
   * @return {void}
   */
  listen () {
    this._registerCreateListener('transaction.applied')
    this._registerCreateListener('transaction.forged')

    this._registerDeleteListener('transaction.expired')
    this._registerDeleteListener('transaction.reverted')
  }

  /**
   * Get the document index.
   * @return {String}
   */
  getIndex () {
    return 'transactions'
  }

  /**
   * Get the document type.
   * @return {String}
   */
  getType () {
    return 'transaction'
  }
}

module.exports = new TransactionIndex()
