const { QueryTypes } = require('sequelize')
const clauses = require('./clauses')
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

    this.criteria.select.columns = clauses.select.apply(arguments)

    return this
  }

  /**
   * [from description]
   * @param  {[type]} table
   * @return {[type]}
   */
  from (table) {
    this.criteria.from = clauses.from.apply(table)

    return this
  }

  /**
   * [where description]
   * @return {[type]}
   */
  where () {
    this.criteria.where.and.push(clauses.where.apply(arguments))

    return this
  }

  /**
   * [whereNot description]
   * @return {[type]}
   */
  whereNot () {
    this.criteria.where.and.push(clauses.whereNot.apply(arguments))

    return this
  }

  /**
   * [whereIn description]
   * @return {[type]}
   */
  whereIn () {
    this.criteria.where.and.push(clauses.whereIn.apply(arguments))

    return this
  }

  /**
   * [whereNotIn description]
   * @return {[type]}
   */
  whereNotIn () {
    this.criteria.where.and.push(clauses.whereNotIn.apply(arguments))

    return this
  }

  /**
   * [whereNull description]
   * @return {[type]}
   */
  whereNull () {
    this.criteria.where.and.push(clauses.whereNull.apply(arguments))

    return this
  }

  /**
   * [whereNotNull description]
   * @return {[type]}
   */
  whereNotNull () {
    this.criteria.where.and.push(clauses.whereNotNull.apply(arguments))

    return this
  }

  /**
   * [whereBetween description]
   * @return {[type]}
   */
  whereBetween () {
    this.criteria.where.and.push(clauses.whereBetween.apply(arguments))

    return this
  }

  /**
   * [whereNotBetween description]
   * @return {[type]}
   */
  whereNotBetween () {
    this.criteria.where.and.push(clauses.whereNotBetween.apply(arguments))

    return this
  }

  /**
   * [orWhere description]
   * @return {[type]}
   */
  orWhere () {
    this.criteria.where.or.push(clauses.where.apply(arguments))

    return this
  }

  /**
   * [orWhereNot description]
   * @return {[type]}
   */
  orWhereNot () {
    this.criteria.where.or.push(clauses.whereNot.apply(arguments))

    return this
  }

  /**
   * [orWhereIn description]
   * @return {[type]}
   */
  orWhereIn () {
    this.criteria.where.or.push(clauses.whereIn.apply(arguments))

    return this
  }

  /**
   * [orWhereNotIn description]
   * @return {[type]}
   */
  orWhereNotIn () {
    this.criteria.where.or.push(clauses.whereNotIn.apply(arguments))

    return this
  }

  /**
   * [orWhereNull description]
   * @return {[type]}
   */
  orWhereNull () {
    this.criteria.where.or.push(clauses.whereNull.apply(arguments))

    return this
  }

  /**
   * [orWhereNotNull description]
   * @return {[type]}
   */
  orWhereNotNull () {
    this.criteria.where.or.push(clauses.whereNotNull.apply(arguments))

    return this
  }

  /**
   * [orWhereBetween description]
   * @return {[type]}
   */
  orWhereBetween () {
    this.criteria.where.or.push(clauses.whereBetween.apply(arguments))

    return this
  }

  /**
   * [orWhereNotBetween description]
   * @return {[type]}
   */
  orWhereNotBetween () {
    this.criteria.where.or.push(clauses.whereNotBetween.apply(arguments))

    return this
  }

  /**
   * [groupBy description]
   * @param  {[type]} column
   * @return {[type]}
   */
  groupBy (column) {
    this.criteria.groupBy = clauses.groupBy.apply(column)

    return this
  }

  /**
   * [orderBy description]
   * @return {[type]}
   */
  orderBy () {
    this.criteria.orderBy = clauses.orderBy.apply(arguments)

    return this
  }

  /**
   * [limit description]
   * @param  {[type]} value
   * @return {[type]}
   */
  limit (value) {
    this.criteria.limit = clauses.limit.apply(value)

    return this
  }

  /**
   * [offset description]
   * @param  {[type]} value
   * @return {[type]}
   */
  offset (value) {
    this.criteria.offset = clauses.offset.apply(value)

    return this
  }

  /**
   * [count description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  count (column, as) {
    this.criteria.select.aggregates.push(clauses.count.apply(column, as))

    return this
  }

  /**
   * [min description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  min (column, as) {
    this.criteria.select.aggregates.push(clauses.min.apply(column, as))

    return this
  }

  /**
   * [max description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  max (column, as) {
    this.criteria.select.aggregates.push(clauses.max.apply(column, as))

    return this
  }

  /**
   * [sum description]
   * @param  {[type]} column
   * @param  {[type]} as
   * @return {[type]}
   */
  sum (column, as) {
    this.criteria.select.aggregates.push(clauses.sum.apply(column, as))

    return this
  }

  /**
   * [avg description]
   * @return {[type]}
   */
  avg () {
    this.criteria.select.aggregates.push(clauses.avg.apply())

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
      select: {
        columns: [],
        aggregates: []
      },
      where: {
        and: [],
        or: []
      }
    }
  }
}
