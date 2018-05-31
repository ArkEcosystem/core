const escape = require('./utils/escape')

class SqlBuilder {
  /**
   * [build description]
   * @param  {[type]} criteria
   * @return {[type]}
   */
  build (criteria) {
    this.criteria = criteria

    let query = ''

    query += this.__buildSelect()
    query += this.__buildFrom()

    if (this.criteria.where) {
      query += this.__buildWhere()
    }

    if (this.criteria.groupBy) {
      query += this.__buildGroupBy()
    }

    if (this.criteria.orderBy) {
      query += this.__buildOrderBy()
    }

    if (this.criteria.limit) {
      query += this.__buildLimit()
    }

    if (this.criteria.offset) {
      query += this.__buildOffset()
    }

    return query
  }

  /**
   * [__buildSelect description]
   * @return {String}
   */
  __buildSelect () {
    const columns = this.criteria.select.columns
      .map(column => escape(column))

    const aggregates = this.criteria.select.aggregates
      .map(column => column)

    return `SELECT ${columns.concat(aggregates).join(',')} `
  }

  /**
   * [__buildFrom description]
   * @return {String}
   */
  __buildFrom () {
    return `FROM ${escape(this.criteria.from)} `
  }

  /**
   * [__buildWhere description]
   * @return {String}
   */
  __buildWhere () {
    const map = (item) => {
      if (item.hasOwnProperty('from') && item.hasOwnProperty('to')) {
        return `${escape(item.column)} ${item.operator} ${escape(item.from)} AND ${escape(item.to)}`
      }

      return `${escape(item.column)} ${item.operator} ${escape(item.value, true)}`
    }

    const andQuery = Object
      .values(this.criteria.where.and)
      .map(item => map(item))
      .join(' AND ')

    const orQuery = Object
      .values(this.criteria.where.or)
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
   * [__buildGroupBy description]
   * @return {String}
   */
  __buildGroupBy () {
    return `GROUP BY "${this.criteria.groupBy}" `
  }

  /**
   * [__buildOrderBy description]
   * @return {String}
   */
  __buildOrderBy () {
    const criteria = Object
      .values(this.criteria.orderBy)
      .map(item => `${escape(item.column)} ${item.direction.toUpperCase()}`)

    return `ORDER BY ${criteria.join(',')} `
  }

  /**
   * [__buildLimit description]
   * @return {String}
   */
  __buildLimit () {
    return `LIMIT ${this.criteria.limit} `
  }

  /**
   * [__buildOffset description]
   * @return {String}
   */
  __buildOffset () {
    return `OFFSET ${this.criteria.offset} `
  }
}

module.exports = new SqlBuilder()
