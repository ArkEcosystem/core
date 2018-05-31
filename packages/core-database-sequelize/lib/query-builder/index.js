const { QueryTypes } = require('sequelize')
const concerns = require('./concerns')

const Sequelize = require('sequelize')
const Op = Sequelize.Op

module.exports = class QueryBuiler {
  /**
   * [constructor description]
   * @param  {[type]} connection
   * @return {[type]}
   */
  constructor (connection) {
    // this.connection = connection

    this.connection = new Sequelize({
      ...{
        dialect: 'postgres',
        username: 'node',
        password: 'password',
        database: 'ark_testnet',
        logging: console.log
      },
      ...{ operatorsAliases: Op }
    })
  }

  async connect () {
    await this.connection.authenticate()

    return this
  }

  /**
   * [select description]
   * @return {[type]}
   */
  select () {
    this.__reset()

    this.criteria.select.columns = concerns.select.apply(arguments)

    return this
  }

  /**
   * [from description]
   * @param  {[type]} table
   * @return {[type]}
   */
  from (table) {
    this.criteria.from = concerns.from.apply(table)

    return this
  }

  /**
   * [where description]
   * @return {[type]}
   */
  where () {
    this.criteria.where.and.push(concerns.where.apply(arguments))

    return this
  }

  /**
   * [whereNot description]
   * @return {[type]}
   */
  whereNot () {
    this.criteria.where.and.push(concerns.whereNot.apply(arguments))

    return this
  }

  /**
   * [whereIn description]
   * @return {[type]}
   */
  whereIn () {
    this.criteria.where.and.push(concerns.whereIn.apply(arguments))

    return this
  }

  /**
   * [whereNotIn description]
   * @return {[type]}
   */
  whereNotIn () {
    this.criteria.where.and.push(concerns.whereNotIn.apply(arguments))

    return this
  }

  /**
   * [whereNull description]
   * @return {[type]}
   */
  whereNull () {
    this.criteria.where.and.push(concerns.whereNull.apply(arguments))

    return this
  }

  /**
   * [whereNotNull description]
   * @return {[type]}
   */
  whereNotNull () {
    this.criteria.where.and.push(concerns.whereNotNull.apply(arguments))

    return this
  }

  /**
   * [whereBetween description]
   * @return {[type]}
   */
  whereBetween () {
    this.criteria.where.and.push(concerns.whereBetween.apply(arguments))

    return this
  }

  /**
   * [whereNotBetween description]
   * @return {[type]}
   */
  whereNotBetween () {
    this.criteria.where.and.push(concerns.whereNotBetween.apply(arguments))

    return this
  }

  /**
   * [orWhere description]
   * @return {[type]}
   */
  orWhere () {
    this.criteria.where.or.push(concerns.where.apply(arguments))

    return this
  }

  /**
   * [orWhereNot description]
   * @return {[type]}
   */
  orWhereNot () {
    this.criteria.where.or.push(concerns.whereNot.apply(arguments))

    return this
  }

  /**
   * [orWhereIn description]
   * @return {[type]}
   */
  orWhereIn () {
    this.criteria.where.or.push(concerns.whereIn.apply(arguments))

    return this
  }

  /**
   * [orWhereNotIn description]
   * @return {[type]}
   */
  orWhereNotIn () {
    this.criteria.where.or.push(concerns.whereNotIn.apply(arguments))

    return this
  }

  /**
   * [orWhereNull description]
   * @return {[type]}
   */
  orWhereNull () {
    this.criteria.where.or.push(concerns.whereNull.apply(arguments))

    return this
  }

  /**
   * [orWhereNotNull description]
   * @return {[type]}
   */
  orWhereNotNull () {
    this.criteria.where.or.push(concerns.whereNotNull.apply(arguments))

    return this
  }

  /**
   * [orWhereBetween description]
   * @return {[type]}
   */
  orWhereBetween () {
    this.criteria.where.or.push(concerns.whereBetween.apply(arguments))

    return this
  }

  /**
   * [orWhereNotBetween description]
   * @return {[type]}
   */
  orWhereNotBetween () {
    this.criteria.where.or.push(concerns.whereNotBetween.apply(arguments))

    return this
  }

  /**
   * [groupBy description]
   * @param  {[type]} column
   * @return {[type]}
   */
  groupBy (column) {
    this.criteria.groupBy = concerns.groupBy.apply(column)

    return this
  }

  /**
   * [orderBy description]
   * @return {[type]}
   */
  orderBy () {
    this.criteria.orderBy = concerns.orderBy.apply(arguments)

    return this
  }

  /**
   * [limit description]
   * @param  {[type]} value
   * @return {[type]}
   */
  limit (value) {
    this.criteria.limit = concerns.limit.apply(value)

    return this
  }

  /**
   * [offset description]
   * @param  {[type]} value
   * @return {[type]}
   */
  offset (value) {
    this.criteria.offset = concerns.offset.apply(value)

    return this
  }

  /**
   * [count description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  count (column, as) {
    this.criteria.select.count = concerns.count.apply(column, as)

    return this
  }

  /**
   * [min description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  min (column, as) {
    this.criteria.select.min = concerns.min.apply(column, as)

    return this
  }

  /**
   * [max description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  max (column, as) {
    this.criteria.select.max = concerns.max.apply(column, as)

    return this
  }

  /**
   * [sum description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  sum (column, as) {
    this.criteria.select.sum = concerns.sum.apply(column, as)

    return this
  }

  /**
   * [avg description]
   * @return {[type]}
   */
  avg () {
    this.criteria.select.avg = concerns.avg.apply()

    return this
  }

  /**
   * [all description]
   * @return {[type]}
   */
  async all () {
    const { query, replacements } = this.__toSQL()

    return this.connection.query(query, {
      replacements,
      type: QueryTypes.SELECT
    })
  }

  /**
   * [first description]
   * @return {[type]}
   */
  async first () {
    const data = await this.all()

    return data[0]
  }

  /**
   * [__toSQL description]
   * @return {[type]}
   */
  __toSQL () {
    let raw = {
      query: '',
      replacements: null
    }

    if (this.criteria.select) {
      raw.query += this.__buildSelect()
    }

    if (this.criteria.from) {
      raw.query += this.__buildFrom()
    }

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
    this.replacements = this.criteria.select.columns

    const criteria = Array(this.criteria.select.columns.length).fill('?').join(',')

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

  /**
   * [__reset description]
   * @return {void}
   */
  __reset () {
    this.criteria = {
      select: {
        columns: []
      },
      where: {
        and: [],
        or: []
      }
    }

    this.replacements = []
  }
}
