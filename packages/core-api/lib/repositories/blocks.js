'use strict'

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')

// const buildFilterQuery = require('./utils/filter-query')
const Repository = require('./repository')

class BlocksRepository extends Repository {
  constructor () {
    super()

    this.model = database.models.block.query()
  }

  /**
   * Get all blocks for the given parameters.
   * @param  {Object}  parameters
   * @return {Object}
   */
  async findAll (parameters = {}) {
    const query = this.model
      .select()
      .from(this.model)

    const orderBy = parameters.orderBy
      ? parameters.orderBy.split(':')
      : ['height', 'desc']

    // const buildQuery = query => {
    //   query = query.from('blocks')

    //   for (let [key, value] of Object.entries(conditions)) {
    //     query = query.where(key, value)
    //   }

    //   return query
    // }

    return this.__findManyWithCount(query, {
      limit: parameters.limit,
      offset: parameters.offset,
      orderBy
    })
  }

  /**
   * Get all blocks for the given generator.
   * @param  {String} generatorPublicKey
   * @param  {Object} paginator
   * @return {Object}
   */
  async findAllByGenerator (generatorPublicKey, paginator) {
    // return this.findAll({...{generatorPublicKey}, ...paginator})
  }

  /**
   * Get a block.
   * @param  {Number} id
   * @return {Object}
   */
  async findById (id) {
    const query = this.model
      .select()
      .from(this.model)
      .where(this.model.id.equals(id))

    return this.__find(query)
    // return this.query
    //   .select(...blocksTableColumns)
    //   .from('blocks')
    //   .where('id', id)
    //   .first()
  }

  /**
   * Get the last block for the given generator.
   * TODO is this right?
   * @param  {String} generatorPublicKey
   * @return {Object}
   */
  async findLastByPublicKey (generatorPublicKey) {
    // return this.query
    //   .select('id', 'timestamp')
    //   .from('blocks')
    //   .where('generator_public_key', generatorPublicKey)
    //   .orderBy('created_at', 'DESC')
    //   .limit(1)
    //   .first()
  }

  /**
   * Search all blocks.
   * @param  {Object} params
   * @return {Object}
   */
  async search (params) {
    // let { conditions } = this.__formatConditions(params)
    // conditions = buildFilterQuery(conditions, {
    //   exact: ['id', 'version', 'previous_block', 'payload_hash', 'generator_public_key', 'block_signature'],
    //   between: ['timestamp', 'height', 'number_of_transactions', 'total_amount', 'total_fee', 'reward', 'payload_length']
    // })

    // const orderBy = params.orderBy
    //   ? params.orderBy.split(':')
    //   : ['height', 'DESC']

    // const buildQuery = query => {
    //   query = query.from('blocks')

    //   conditions.forEach(condition => {
    //     query = query.where(condition.column, condition.operator, condition.value)
    //   })

    //   return query
    // }

    // let rows = []
    // const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    // if (count) {
    //   const selectQuery = buildQuery(this.query.select(...blocksTableColumns))
    //   rows = await this.__runQuery(selectQuery, {
    //     limit: params.limit,
    //     offset: params.offset,
    //     orderBy
    //   })
    // }

    // return { rows, count }
  }

  /**
   * Count all blocks.
   * @return {Number}
   */
  async count () {
    // return super.__count('blocks')
  }
}

module.exports = new BlocksRepository()
