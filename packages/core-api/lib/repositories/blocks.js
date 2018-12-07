const app = require('@arkecosystem/core-container')

const database = app.resolvePlugin('database')

const buildFilterQuery = require('./utils/filter-query')
const Repository = require('./repository')

class BlocksRepository extends Repository {
  /**
   * Get all blocks for the given parameters.
   * @param  {Object}  parameters
   * @return {Object}
   */
  async findAll(parameters = {}) {
    const selectQuery = this.query.select().from(this.query)
    const countQuery = this._makeEstimateQuery()

    const applyConditions = queries => {
      const conditions = Object.entries(this._formatConditions(parameters))

      if (conditions.length) {
        const first = conditions.shift()

        for (const item of queries) {
          item.where(this.query[first[0]].equals(first[1]))

          for (const condition of conditions) {
            item.and(this.query[condition[0]].equals(condition[1]))
          }
        }
      }
    }

    applyConditions([selectQuery, countQuery])

    return this._findManyWithCount(selectQuery, countQuery, {
      limit: parameters.limit,
      offset: parameters.offset,
      orderBy: this.__orderBy(parameters),
    })
  }

  /**
   * Get all blocks for the given generator.
   * @param  {String} generatorPublicKey
   * @param  {Object} paginator
   * @return {Object}
   */
  async findAllByGenerator(generatorPublicKey, paginator) {
    return this.findAll({ ...{ generatorPublicKey }, ...paginator })
  }

  /**
   * Get a block.
   * @param  {Number} value
   * @return {Object}
   */
  async findById(value) {
    const query = this.query
      .select()
      .from(this.query)
      .where(this.query.id.equals(value))

    // ensure that the value is not greater than 2147483647 (psql max int size)
    const height = +value
    if (height <= 2147483647) {
      query.or(this.query.height.equals(height))
    }

    return this._find(query)
  }

  /**
   * Get the last block for the given generator.
   * TODO is this right?
   * @param  {String} generatorPublicKey
   * @return {Object}
   */
  async findLastByPublicKey(generatorPublicKey) {
    const query = this.query
      .select(this.query.id, this.query.timestamp)
      .from(this.query)
      .where(this.query.generator_public_key.equals(generatorPublicKey))
      .order(this.query.height.desc)

    return this._find(query)
  }

  /**
   * Search all blocks.
   * @param  {Object} parameters
   * @return {Object}
   */
  async search(parameters) {
    const selectQuery = this.query.select().from(this.query)
    const countQuery = this._makeEstimateQuery()

    const applyConditions = queries => {
      const conditions = buildFilterQuery(this._formatConditions(parameters), {
        exact: [
          'id',
          'version',
          'previous_block',
          'payload_hash',
          'generator_public_key',
          'block_signature',
        ],
        between: [
          'timestamp',
          'height',
          'number_of_transactions',
          'total_amount',
          'total_fee',
          'reward',
          'payload_length',
        ],
      })

      if (conditions.length) {
        const first = conditions.shift()

        for (const item of queries) {
          item.where(this.query[first.column][first.method](first.value))

          for (const condition of conditions) {
            item.and(
              this.query[condition.column][condition.method](condition.value),
            )
          }
        }
      }
    }

    applyConditions([selectQuery, countQuery])

    return this._findManyWithCount(selectQuery, countQuery, {
      limit: parameters.limit,
      offset: parameters.offset,
      orderBy: this.__orderBy(parameters),
    })
  }

  getModel() {
    return database.models.block
  }

  __orderBy(parameters) {
    if (!parameters.orderBy) return ['height', 'desc']

    const orderBy = parameters.orderBy.split(':').map(p => p.toLowerCase())
    if (orderBy.length !== 2 || ['desc', 'asc'].includes(orderBy[1]) !== true) {
      return ['height', 'desc']
    }

    return orderBy
  }
}

module.exports = new BlocksRepository()
