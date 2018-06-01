'use strict'

const buildFilterQuery = require('./utils/filter-query')

module.exports = class BlocksRepository {
  /**
   * Create a new block repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    this.connection = connection
    this.query = connection.query
  }

  /**
   * Get all blocks for the given parameters.
   * @param  {Object}  params
   * @return {Object}
   */
  async findAll (params = {}) {
    let whereStatement = {}

    const filter = ['generatorPublicKey', 'totalAmount', 'totalFee', 'reward', 'previousBlock', 'height']

    for (const elem of filter) {
      if (params[elem]) {
        whereStatement[elem] = params[elem]
      }
    }

    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['height', 'DESC']

    const buildQuery = (query) => {
      return query.from('blocks').where(whereStatement)
    }

    let rows = await buildQuery(this.query.select('*'))
      .orderBy(orderBy[0], orderBy[1])
      .limit(params.limit)
      .offset(params.offset)
      .all()

    // let count = await buildQuery(this.query.select('COUNT(DISTINCT id) as count')).first()

    return {
      rows,
      count: rows.length
      // count: count.count
    }
  }

  /**
   * Get all blocks for the given generator.
   * @param  {String} generatorPublicKey
   * @param  {Object} paginator
   * @return {Object}
   */
  findAllByGenerator (generatorPublicKey, paginator) {
    return this.findAll({...{generatorPublicKey}, ...paginator})
  }

  /**
   * Get a block.
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.query
      .select('*')
      .from('blocks')
      .where('id', id)
      .first()
  }

  /**
   * Get the last block for the given generator.
   * @param  {String} generatorPublicKey
   * @return {Object}
   */
  findLastByPublicKey (generatorPublicKey) {
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

    const buildQuery = (query) => {
      return query.from('blocks').where(conditions)
    }

    let rows = await buildQuery(this.query.select('*'))
      .orderBy(orderBy[0], orderBy[1])
      .limit(params.limit)
      .offset(params.offset)
      .all()

    let count = await buildQuery(this.query.select('COUNT(DISTINCT id) as count')).first()

    return {
      rows,
      count: count.count
    }
  }

  /**
   * Count all blocks.
   * @return {Number}
   */
  count () {
    return this
      .connection
      .query
      .select('COUNT(DISTINCT id) as count')
      .from('blocks')
      .first()
  }
}
