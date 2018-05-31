const { QueryTypes } = require('sequelize')
const concerns = require('./concerns')
const SqlBuilder = require('./sql-builder')

module.exports = class QueryBuiler {
  /**
   * [constructor description]
   * @param  {[type]} connection
   * @return {[type]}
   */
  constructor (connection) {
    this.connection = connection
  }

  /**
   * [select description]
   * @return {[type]}
   */
  select () {
    this.__reset()

    this.criteria.select = concerns.select.apply(arguments)

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
    this.criteria.select.push(concerns.count.apply(column, as))

    return this
  }

  /**
   * [min description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  min (column, as) {
    this.criteria.select.push(concerns.min.apply(column, as))

    return this
  }

  /**
   * [max description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  max (column, as) {
    this.criteria.select.push(concerns.max.apply(column, as))

    return this
  }

  /**
   * [sum description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  sum (column, as) {
    this.criteria.select.push(concerns.sum.apply(column, as))

    return this
  }

  /**
   * [avg description]
   * @return {[type]}
   */
  avg () {
    this.criteria.select.push(concerns.avg.apply())

    return this
  }

  /**
   * [all description]
   * @return {[type]}
   */
  async all () {
    return this.connection.query(SqlBuilder.build(this.criteria), {
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
   * [__reset description]
   * @return {void}
   */
  __reset () {
    this.criteria = {
      select: [],
      where: {
        and: [],
        or: []
      }
    }
  }
}
