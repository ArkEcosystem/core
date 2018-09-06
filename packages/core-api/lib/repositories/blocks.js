'use strict'

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')

// const buildFilterQuery = require('./utils/filter-query')
const Repository = require('./repository')

class BlocksRepository extends Repository {
  constructor () {
    super()

    this.model = database.models.block
    this.query = this.model.query()
  }

  /**
   * Get all blocks for the given parameters.
   * @param  {Object}  parameters
   * @return {Object}
   */
  async findAll (parameters = {}) {
    const query = this.query
      .select()
      .from(this.query)

    const orderBy = parameters.orderBy
      ? parameters.orderBy.split(':')
      : ['height', 'desc']

    for (let [key, value] of super.__formatConditions(parameters)) {
      query.where(this.query[key].equals(value))
    }

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
    return this.findAll({...{generatorPublicKey}, ...paginator})
  }

  /**
   * Get a block.
   * @param  {Number} id
   * @return {Object}
   */
  async findById (id) {
    const query = this.query
      .select()
      .from(this.query)
      .where(this.query.id.equals(id))

    return this.__find(query)
  }

  /**
   * Get the last block for the given generator.
   * TODO is this right?
   * @param  {String} generatorPublicKey
   * @return {Object}
   */
  async findLastByPublicKey (generatorPublicKey) {
    const query = this.query
      .select(this.query.id, this.query.timestamp)
      .from(this.query)
      .where(this.query.generator_public_key.equals(generatorPublicKey))
      .order(this.query.created_at.desc)

    return this.__find(query)
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
}

module.exports = new BlocksRepository()
