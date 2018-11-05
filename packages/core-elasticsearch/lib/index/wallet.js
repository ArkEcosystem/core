'use strict'

const container = require('@arkecosystem/core-container')
const emitter = container.resolvePlugin('event-emitter')
const database = container.resolvePlugin('database')
const logger = container.resolvePlugin('logger')
const Index = require('./index')
const client = require('../services/client')

class WalletIndex extends Index {
  /**
   * Index wallets using the specified chunk size.
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
        .limit(this.chunkSize)
        .offset(this.chunkSize * i)

      const rows = await database.query.manyOrNone(query.toQuery())

      if (!rows.length) {
        continue
      }

      logger.info(`[Elasticsearch] Indexing ${rows.length} wallets :card_index_dividers:`)

      try {
        rows.forEach(row => (row.id = row.address))

        await client.bulk(this._buildBulkUpsert(rows))
      } catch (error) {
        logger.error(`[Elasticsearch] ${error.message} :exclamation:`)
      }
    }
  }

  /**
   * Register listeners for "wallet.*" events.
   * @return {void}
   */
  listen () {
    emitter.on('wallets:updated', data => this.index())
  }

  /**
   * Get the document index.
   * @return {String}
   */
  getIndex () {
    return 'wallets'
  }

  /**
   * Get the document type.
   * @return {String}
   */
  getType () {
    return 'wallet'
  }
}

module.exports = new WalletIndex()
