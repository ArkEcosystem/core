'use strict'

const invertBy = require('lodash/invertBy')

const defaults = {
  limit: 100,
  offset: 0
}

module.exports = class Repository {
  /**
   * Create a new repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection, model) {
    this.connection = connection
    this.query = connection.query

    this.model = connection.models[model]
    if (!this.model) {
        throw new Error(`${model} model not found.`)
    }
}

  /**
   * Executes the query. It admits some parameters to sort the results and to
   * reduce their number.
   *
   * @param {QueryBuilder} query - The query to execute
   * @param {Object} params
   * @param {Number} [params.limit] - Limit the results to this number of rows
   * @param {Number} [params.offset] - Use this number as the offset
   * @param {Array} params.orderBy - Sort the results by this field, ASC or DESC
   */
  async __runQuery (query, { limit, offset, orderBy }) {
    return query
      .limit(limit || defaults.limit)
      .offset(offset || defaults.offset)
      .orderBy(orderBy[0], orderBy[1])
      .all()
  }

  /**
   * Count all the records of a table.
   * @return {Number}
   */
  async __count (table) {
    return this
      .query
      .select()
      .countDistinct('id', 'count')
      .from(table)
      .first()
  }

  __formatConditions (params) {
    const { fieldAttributeMap, tableAttributes } = this.model

    const validParams = Object.keys(tableAttributes)
    const filter = args => {
      return args.filter(elem => validParams.includes(elem))
    }

    // invert direction of mapping, camelCase => snake_case
    // the mapping is necessary if a param is camelCase otherwise
    // the param can be directly used.
    // e.g. recipientId => recipient_id, but type => type
    const fieldMappings = invertBy(fieldAttributeMap)
    const conditions = filter(Object.keys(params)).reduce((all, column) => {
      const columnName = fieldMappings[column] || column
      all[columnName] = params[column]
      return all
    }, {})

    return { conditions, filter }
  }
}
