module.exports = class SqlBuilder {
  /**
   * [build description]
   * @param  {[type]} criteria     [description]
   * @param  {[type]} replacements [description]
   * @return {[type]}              [description]
   */
  static build (criteria, replacements) {
    this.criteria = criteria
    this.replacements = replacements

    let raw = {
      query: '',
      replacements: null
    }

    raw.query += this.__buildSelect()
    raw.query += this.__buildFrom()

    if (this.criteria.where) {
      raw.query += this.__buildWhere()
    }

    if (this.criteria.groupBy) {
      raw.query += this.__buildGroupBy()
    }

    if (this.criteria.orderBy) {
      raw.query += this.__buildOrderBy()
    }

    if (this.criteria.limit) {
      raw.query += this.__buildLimit()
    }

    if (this.criteria.offset) {
      raw.query += this.__buildOffset()
    }

    raw.replacements = this.replacements

    this.__reset()

    return raw
  }

  /**
   * [__buildSelect description]
   * @return {String}
   */
  __buildSelect () {
    this.replacements = this.criteria.select

    const criteria = Array(this.criteria.select.length).fill('?').join(',')

    return `SELECT ${criteria} `
  }

  /**
   * [__buildFrom description]
   * @return {String}
   */
  __buildFrom () {
    this.replacements.push(this.criteria.from)

    return 'FROM ? '
  }

  /**
   * [__buildWhere description]
   * @return {String}
   */
  __buildWhere () {
    const map = (item) => {
      this.replacements.push(item.column)

      if (item.hasOwnProperty('from') && item.hasOwnProperty('to')) {
        this.replacements.push(item.from)
        this.replacements.push(item.to)

        return `? ${item.operator} ? AND ?`
      } else {
        this.replacements.push(item.value)

        return `? ${item.operator} ?`
      }
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
    this.replacements.push(this.criteria.groupBy)

    return 'GROUP BY ? '
  }

  /**
   * [__buildOrderBy description]
   * @return {String}
   */
  __buildOrderBy () {
    const criteria = []

    Object.values(this.criteria.orderBy).forEach(item => {
      this.replacements.push(item.column)

      criteria.push(`? ${item.direction.toUpperCase()}`)
    })

    return `ORDER BY ${criteria.join(',')} `
  }

  /**
   * [__buildLimit description]
   * @return {String}
   */
  __buildLimit () {
    this.replacements.push(this.criteria.limit)

    return 'LIMIT ? '
  }

  /**
   * [__buildOffset description]
   * @return {String}
   */
  __buildOffset () {
    this.replacements.push(this.criteria.offset)

    return 'OFFSET ? '
  }
}
