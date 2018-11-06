'use strict'

const { first, last } = require('lodash')
const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')
const logger = container.resolvePlugin('logger')
const Index = require('./index')
const client = require('../services/client')
const storage = require('../services/storage')

class BlockIndex extends Index {
  /**
   * Index blocks using the specified chunk size.
   * @return {void}
   */
  async index () {
    const { count } = await this.__count()

    const queries = Math.ceil(count / this.chunkSize)

    for (let i = 0; i < queries; i++) {
      const modelQuery = this.__createQuery()

      const query = modelQuery
        .select()
        .from(modelQuery)
        .where(modelQuery.timestamp.gte(storage.get('history', 'lastBlock')))
        .order(modelQuery.height.asc)
        .limit(this.chunkSize)
        .offset(this.chunkSize * i)

      const rows = await database.query.manyOrNone(query.toQuery())

      if (!rows.length) {
        continue
      }

      const heights = rows.map(row => row.height)
      logger.info(`[Elasticsearch] Indexing blocks from height ${first(heights)} to ${last(heights)} :card_index_dividers:`)

      try {
        await client.bulk(this._buildBulkUpsert(rows))

        storage.update('history', {
          lastBlock: last(heights)
        })
      } catch (error) {
        logger.error(`[Elasticsearch] ${error.message} :exclamation:`)
      }
    }
  }

  /**
   * Register listeners for "block.*" events.
   * @return {void}
   */
  listen () {
    this._registerCreateListener('block.applied')
    // this._registerCreateListener('block.forged')

    this._registerDeleteListener('block.reverted')
  }

  /**
   * Get the document index.
   * @return {String}
   */
  getIndex () {
    return 'blocks'
  }

  /**
   * Get the document type.
   * @return {String}
   */
  getType () {
    return 'block'
  }
}

module.exports = new BlockIndex()
