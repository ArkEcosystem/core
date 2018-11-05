'use strict'

const { first, last } = require('lodash')
const container = require('@arkecosystem/core-container')
const emitter = container.resolvePlugin('event-emitter')
const database = container.resolvePlugin('database')
const logger = container.resolvePlugin('logger')
const Index = require('./index')
const client = require('../services/client')
const storage = require('../services/storage')

class RoundIndex extends Index {
  /**
   * Index rounds using the specified chunk size.
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
        .where(modelQuery.round.gte(storage.get('history', 'lastRound')))
        .order(modelQuery.round.asc)
        .limit(this.chunkSize)
        .offset(this.chunkSize * i)

      const rows = await database.query.manyOrNone(query.toQuery())

      if (!rows.length) {
        continue
      }

      const roundIds = rows.map(row => row.round)
      logger.info(`[Elasticsearch] Indexing rounds from ${first(roundIds)} to ${last(roundIds)} :card_index_dividers:`)

      try {
        await client.bulk(this._buildBulkUpsert(rows))

        storage.update('history', {
          lastRound: last(roundIds)
        })
      } catch (error) {
        logger.error(`[Elasticsearch] ${error.message} :exclamation:`)
      }
    }
  }

  /**
   * Register listeners for "round.*" events.
   * @return {void}
   */
  listen () {
    emitter.on('round.created', data => this.index())
  }

  /**
   * Get the document index.
   * @return {String}
   */
  getIndex () {
    return 'rounds'
  }

  /**
   * Get the document type.
   * @return {String}
   */
  getType () {
    return 'round'
  }
}

module.exports = new RoundIndex()
