'use strict'

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')

const buildFilterQuery = require('./utils/filter-query')
const Repository = require('./repository')

class BlocksRepository extends Repository {
  getModel () {
    return database.models.block
  }

  /**
   * Get all blocks for the given parameters.
   * @param  {Object}  parameters
   * @return {Object}
   */
  async findAll (parameters = {}) {
    const query = this.query.select().from(this.query)

    const conditions = super.__formatConditions(parameters)

    if (conditions.length) {
      const first = conditions.shift()

      query.where(this.query[0].equals(first[1]))

      for (const condition of conditions) {
        query.and(this.query[condition[0]].equals(condition[1]))
      }
    }

    return this.__findManyWithCount(query, {
      limit: parameters.limit,
      offset: parameters.offset,
      orderBy: this.__orderBy(parameters)
    })
  }

  /**
   * Get all blocks for the given generator.
   * @param  {String} generatorPublicKey
   * @param  {Object} paginator
   * @return {Object}
   */
  async findAllByGenerator (generatorPublicKey, paginator) {
    return this.findAll({...{ generatorPublicKey }, ...paginator})
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
   * @param  {Object} parameters
   * @return {Object}
   */
  async search (parameters) {
    const query = this.query.select().from(this.query)

    const conditions = buildFilterQuery(this.__formatConditions(parameters), {
      exact: ['id', 'version', 'previous_block', 'payload_hash', 'generator_public_key', 'block_signature'],
      between: ['timestamp', 'height', 'number_of_transactions', 'total_amount', 'total_fee', 'reward', 'payload_length']
    })

    if (conditions.length) {
      const first = conditions.shift()

      query.where(this.query[first.column][first.method](first.value))

      for (const condition of conditions) {
        query.and(this.query[condition.column][condition.method](condition.value))
      }
    }

    return this.__findManyWithCount(query, {
      limit: parameters.limit,
      offset: parameters.offset,
      orderBy: this.__orderBy(parameters)
    })
  }

  __orderBy (parameters) {
    return parameters.orderBy
      ? parameters.orderBy.split(':')
      : ['height', 'desc']
  }
}

module.exports = new BlocksRepository()
