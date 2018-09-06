'use strict'

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')

// const invertBy = require('lodash/invertBy')

// const defaults = {
//   limit: 100,
//   offset: 0
// }

module.exports = class Repository {
  async __find (query) {
    return database.query.oneOrNone(query.toQuery())
  }

  async __findMany (query) {
    return database.query.manyOrNone(query.toQuery())
  }

  /**
   * Finds many related records and estimates their count.
   *
   * @param {QueryBuilder} query
   * @param {Object} params
   * @param {Number} params.limit
   * @param {Number} params.offset
   * @param {Array} params.orderBy
   */
  async __findManyWithCount (query, { limit, offset, orderBy }) {
    const selectQuery = query
      .order(this.model[orderBy[0]][orderBy[1]])
      .limit(limit)
      .offset(offset)

    return {
      rows: await this.__findMany(selectQuery),
      count: await this.__estimate(query)
    }
  }

  /**
   * Estimate the count of all the records of a table.
   * @return {Number}
   */
  async __estimate (query) {
    const { countEstimate } = await database.query.one(`SELECT count_estimate ('${query.toQuery().text}');`)

    return countEstimate
  }
  /**
   * Count all the records of a table.
   * @return {Number}
   */
  async __count (table) {
    // return this
    //   .query
    //   .select()
    //   .countDistinct('id', 'count')
    //   .from(table)
    //   .first()
  }

  __formatConditions (params) {
    // const { fieldAttributeMap, tableAttributes } = this.model

    // const validParams = Object.keys(tableAttributes)
    // const filter = args => {
    //   return args.filter(elem => validParams.includes(elem))
    // }

    // // invert direction of mapping, camelCase => snake_case
    // // the mapping is necessary if a param is camelCase otherwise
    // // the param can be directly used.
    // // e.g. recipientId => recipient_id, but type => type
    // const fieldMappings = invertBy(fieldAttributeMap)
    // const conditions = filter(Object.keys(params)).reduce((all, column) => {
    //   const columnName = fieldMappings[column] || column
    //   all[columnName] = params[column]
    //   return all
    // }, {})

    // return { conditions, filter }
  }
}
