const { camelCase, upperFirst } = require('lodash')
const escape = require('./utils/escape')

class SqlBuilder {
  /**
   * Build the clauses.
   * @param  {Object} criteria
   * @return {String}
   */
  build (criteria) {
    return Object
      .keys(criteria)
      .map(key => this[`__build${upperFirst(camelCase(key))}`](criteria))
      .join('')
  }

  /**
   * Build the "SELECT" clause.
   * @param  {Object} criteria
   * @return {String}
   */
  __buildSelect (criteria) {
    const columns = criteria.select.columns
      .map(column => escape(column))

    const aggregates = criteria.select.aggregates
      .map(column => column)

    return `SELECT ${columns.concat(aggregates).join(',')} `
  }

  /**
   * Build the "FROM" clause.
   * @param  {Object} criteria
   * @return {String}
   */
  __buildFrom (criteria) {
    return `FROM ${escape(criteria.from)} `
  }

  /**
   * Build the "WHERE" clause.
   * @param  {Object} criteria
   * @return {String}
   */
  __buildWhere (criteria) {
    const map = (item) => {
      if (item.hasOwnProperty('from') && item.hasOwnProperty('to')) {
        return `${escape(item.column)} ${item.operator} ${escape(item.from)} AND ${escape(item.to)}`
      }

      return `${escape(item.column)} ${item.operator} ${escape(item.value, true)}`
    }

    const andQuery = Object
      .values(criteria.where.and)
      .map(item => map(item))
      .join(' AND ')

    const orQuery = Object
      .values(criteria.where.or)
      .map(item => map(item))
      .join(' OR ')

    if (!andQuery && !orQuery) {
      return ''
    }

    let query = 'WHERE '

    if (andQuery) {
      query += andQuery
    }

    if (orQuery) {
      query += ` OR ${orQuery}`
    }

    return `${query} `
  }

  /**
   * Build the "GROUP BY" clause.
   * @param  {Object} criteria
   * @return {String}
   */
  __buildGroupBy (criteria) {
    return `GROUP BY "${criteria.groupBy}" `
  }

  /**
   * Build the "ORDER BY" clause.
   * @param  {Object} criteria
   * @return {String}
   */
  __buildOrderBy (criteria) {
    const values = Object
      .values(criteria.orderBy)
      .map(item => `${escape(item.column)} ${item.direction.toUpperCase()}`)

    return `ORDER BY ${values.join(',')} `
  }

  /**
   * Build the "LIMIT" clause.
   * @param  {Object} criteria
   * @return {String}
   */
  __buildLimit (criteria) {
    return `LIMIT ${criteria.limit} `
  }

  /**
   * Build the "OFFSET" clause.
   * @param  {Object} criteria
   * @return {String}
   */
  __buildOffset (criteria) {
    return `OFFSET ${criteria.offset} `
  }
}

module.exports = new SqlBuilder()
