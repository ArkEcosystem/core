const { QueryTypes } = require('sequelize')
const clauses = require('./clauses')
const SqlBuilder = require('./sql-builder')
const { get, set } = require('lodash')

module.exports = class QueryBuiler {
  /**
   * [constructor description]
   * @param  {[type]} connection
   * @return {QueryBuilder}
   */
  constructor (connection, models) {
    this.connection = connection
    this.models = Object.keys(models).map(k => models[k])
  }

  /**
   * [select description]
   * @return {QueryBuilder}
   */
  select () {
    this.__reset()

    this.clauses.select.columns = clauses.select(arguments)

    return this
  }

  /**
   * [from description]
   * @param  {String} table
   * @return {QueryBuilder}
   */
  from (table) {
    this.clauses.from = clauses.from(table)

    return this
  }

  /**
   * [where description]
   * @return {QueryBuilder}
   */
  where () {
    this.__pushClause('clauses.where.and', clauses.where(arguments))

    return this
  }

  /**
   * [whereIn description]
   * @return {QueryBuilder}
   */
  whereIn () {
    this.__pushClause('clauses.where.and', clauses.whereIn(arguments))

    return this
  }

  /**
   * [whereNotIn description]
   * @return {QueryBuilder}
   */
  whereNotIn () {
    this.__pushClause('clauses.where.and', clauses.whereNotIn(arguments))

    return this
  }

  /**
   * [whereNull description]
   * @return {QueryBuilder}
   */
  whereNull () {
    this.__pushClause('clauses.where.and', clauses.whereNull(arguments))

    return this
  }

  /**
   * [whereNotNull description]
   * @return {QueryBuilder}
   */
  whereNotNull () {
    this.__pushClause('clauses.where.and', clauses.whereNotNull(arguments))

    return this
  }

  /**
   * [whereBetween description]
   * @return {QueryBuilder}
   */
  whereBetween () {
    this.__pushClause('clauses.where.and', clauses.whereBetween(arguments))

    return this
  }

  /**
   * [whereNotBetween description]
   * @return {QueryBuilder}
   */
  whereNotBetween () {
    this.__pushClause('clauses.where.and', clauses.whereNotBetween(arguments))

    return this
  }

  /**
   * [orWhere description]
   * @return {QueryBuilder}
   */
  orWhere () {
    this.__pushClause('clauses.where.or', clauses.where(arguments))

    return this
  }

  /**
   * [orWhereIn description]
   * @return {QueryBuilder}
   */
  orWhereIn () {
    this.__pushClause('clauses.where.or', clauses.whereIn(arguments))

    return this
  }

  /**
   * [orWhereNotIn description]
   * @return {QueryBuilder}
   */
  orWhereNotIn () {
    this.__pushClause('clauses.where.or', clauses.whereNotIn(arguments))

    return this
  }

  /**
   * [orWhereNull description]
   * @return {QueryBuilder}
   */
  orWhereNull () {
    this.__pushClause('clauses.where.or', clauses.whereNull(arguments))

    return this
  }

  /**
   * [orWhereNotNull description]
   * @return {QueryBuilder}
   */
  orWhereNotNull () {
    this.__pushClause('clauses.where.or', clauses.whereNotNull(arguments))

    return this
  }

  /**
   * [orWhereBetween description]
   * @return {QueryBuilder}
   */
  orWhereBetween () {
    this.__pushClause('clauses.where.or', clauses.whereBetween(arguments))

    return this
  }

  /**
   * [orWhereNotBetween description]
   * @return {QueryBuilder}
   */
  orWhereNotBetween () {
    this.__pushClause('clauses.where.or', clauses.whereNotBetween(arguments))

    return this
  }

  /**
   * [groupBy description]
   * @param  {String} column
   * @return {QueryBuilder}
   */
  groupBy (column) {
    this.clauses.groupBy = clauses.groupBy(column)

    return this
  }

  /**
   * [orderBy description]
   * @return {QueryBuilder}
   */
  orderBy () {
    this.clauses.orderBy = clauses.orderBy(arguments)

    return this
  }

  /**
   * [limit description]
   * @param  {Number} value
   * @return {QueryBuilder}
   */
  limit (value) {
    this.clauses.limit = clauses.limit(value)

    return this
  }

  /**
   * [offset description]
   * @param  {Number} value
   * @return {QueryBuilder}
   */
  offset (value) {
    this.clauses.offset = clauses.offset(value)

    return this
  }

  /**
   * [count description]
   * @return {QueryBuilder}
   */
  count (column, alias) {
    this.__pushClause('clauses.select.aggregates', clauses.count(column, alias))

    return this
  }

  /**
   * [countDistinct description]
   * @return {QueryBuilder}
   */
  countDistinct (column, alias) {
    this.__pushClause('clauses.select.aggregates', clauses.countDistinct(column, alias))

    return this
  }

  /**
   * [min description]
   * @return {QueryBuilder}
   */
  min (column, alias) {
    this.__pushClause('clauses.select.aggregates', clauses.min(column, alias))

    return this
  }

  /**
   * [max description]
   * @return {QueryBuilder}
   */
  max (column, alias) {
    this.__pushClause('clauses.select.aggregates', clauses.max(column, alias))

    return this
  }

  /**
   * [sum description]
   * @return {QueryBuilder}
   */
  sum (column, alias) {
    this.__pushClause('clauses.select.aggregates', clauses.sum(column, alias))

    return this
  }

  /**
   * [avg description]
   * @return {QueryBuilder}
   */
  avg (column, alias) {
    this.__pushClause('clauses.select.aggregates', clauses.avg(column, alias))

    return this
  }

  /**
   * [all description]
   * @return {QueryBuilder}
   */
  async all () {
    const { fieldAttributeMap } = this.models.find(m => m.tableName === this.clauses.from) || {}

    return this.connection.query(SqlBuilder.build(this.clauses), {
        type: QueryTypes.SELECT,
        fieldMap: fieldAttributeMap
    })
  }

  /**
   * [first description]
   * @return {QueryBuilder}
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
    this.clauses = {
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

  __pushClause (collection, clause) {
    set(this, collection, get(this, collection).concat(clause))
  }
}
