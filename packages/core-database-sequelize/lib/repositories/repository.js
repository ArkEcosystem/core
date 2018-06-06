'use strict'

const defaults = {
  limit: 100,
  offset: 0
}

module.exports = class Repository {
  /**
   * Create a new repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    this.connection = connection
    this.query = connection.query
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
      .select('count')
      .countDistinct('id', 'count')
      .from(table)
      .first()
  }
}
