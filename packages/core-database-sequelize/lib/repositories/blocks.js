'use strict'

const buildFilterQuery = require('./utils/filter-query')
const Repository = require('./repository')

const blocksTableColumns = ['id', 'version', 'timestamp', 'previousBlock', 'height', 'numberOfTransactions', 'totalAmount', 'totalFee', 'reward', 'payloadLength', 'payloadHash', 'generatorPublicKey', 'blockSignature']

module.exports = class BlocksRepository extends Repository {
  /**
   * Get all blocks for the given parameters.
   * TODO throw an Error if the params aren't the available filters
   * @param  {Object}  params
   * @return {Object}
   */
  async findAll (params = {}) {
    let conditions = {}

    const filter = ['generatorPublicKey', 'totalAmount', 'totalFee', 'reward', 'previousBlock', 'height']

    for (const elem of filter) {
      if (params[elem]) {
        conditions[elem] = params[elem]
      }
    }

    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['height', 'DESC']

    const buildQuery = query => {
      query = query.from('blocks')

      for (let [key, value] of Object.entries(conditions)) {
        query = query.where(key, value)
      }

      return query
    }

    let rows = []

    // NOTE: The real count is avoided because it degrades the performance of the node
    // const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    // if (count) {
      const selectQuery = buildQuery(this.query.select(...blocksTableColumns))
      rows = await this.__runQuery(selectQuery, {
        limit: params.limit,
        offset: params.offset,
        orderBy
      })
    // }

    return { rows, count: rows.length }
  }

  /**
   * Get all blocks for the given generator.
   * @param  {String} generatorPublicKey
   * @param  {Object} paginator
   * @return {Object}
   */
  async findAllByGenerator (generatorPublicKey, paginator) {
    return this.findAll({...{generatorPublicKey}, ...paginator})
  }

  /**
   * Get a block.
   * @param  {Number} id
   * @return {Object}
   */
  async findById (id) {
    return this.query
      .select(...blocksTableColumns)
      .from('blocks')
      .where('id', id)
      .first()
  }

  /**
   * Get the last block for the given generator.
   * TODO is this right?
   * @param  {String} generatorPublicKey
   * @return {Object}
   */
  async findLastByPublicKey (generatorPublicKey) {
    return this.query
      .select('id', 'timestamp')
      .from('blocks')
      .where('generatorPublicKey', generatorPublicKey)
      .orderBy('createdAt', 'DESC')
      .limit(1)
      .first()
  }

  /**
   * Search all blocks.
   * @param  {Object} params
   * @return {Object}
   */
  async search (params) {
    const conditions = buildFilterQuery(params, {
      exact: ['id', 'version', 'previousBlock', 'payloadHash', 'generatorPublicKey', 'blockSignature'],
      between: ['timestamp', 'height', 'numberOfTransactions', 'totalAmount', 'totalFee', 'reward', 'payloadLength']
    })

    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['height', 'DESC']

    const buildQuery = query => {
      query = query.from('blocks')

      conditions.forEach(condition => {
        query = query.where(condition.column, condition.operator, condition.value)
      })

      return query
    }

    let rows = []
    const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    if (count) {
      const selectQuery = buildQuery(this.query.select(...blocksTableColumns))
      rows = await this.__runQuery(selectQuery, {
        limit: params.limit,
        offset: params.offset,
        orderBy
      })
    }

    return { rows, count }
  }

  /**
   * Count all blocks.
   * @return {Number}
   */
  async count () {
    return super.__count('blocks')
  }
}
