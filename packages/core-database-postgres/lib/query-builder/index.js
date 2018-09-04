const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const path = require('path')
const { get, set } = require('lodash')

const clauses = require('./clauses')
const SqlBuilder = require('./sql-builder')

module.exports = class QueryBuiler {
  /**
   * [constructor description]
   * @param  {[type]} connection
   * @return {QueryBuilder}
   */
  constructor (connection) {
    this.connection = connection
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
    let { sql, replacements } = SqlBuilder.build(this.clauses)
    // const { fieldAttributeMap } = this.models.find(m => m.tableName === this.clauses.from) || {}

    try {
      logger.debug(`QUERY: ${sql}`)
      logger.debug(`PARAM: ${JSON.stringify(replacements)}`)
      return this.connection.connection.any(sql, replacements)
    } catch (e) {
      logger.error(e)
    }
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
   * Execute the given query and expect no results.
   * @param  {String} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async none (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'none')
  }

  /**
   * Execute the given query and expect one result.
   * @param  {String} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async one (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'one')
  }

  /**
   * Execute the given query and expect one or no results.
   * @param  {String} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async oneOrNone (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'oneOrNone')
  }

  /**
   * Execute the given query and expect many results.
   * @param  {String} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async many (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'many')
  }

  /**
   * Execute the given query and expect many or no results.
   * @param  {String} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async manyOrNone (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'manyOrNone')
  }

  /**
   * Execute the given query and expect any results.
   * @param  {String} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async any (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'any')
  }

  /**
   * Execute the given query using the given method and parameters.
   * @param  {String} file
   * @param  {Array} parameters
   * @param  {String} method
   * @return {QueryBuilder}
   */
  async __executeQueryFile (file, parameters, method) {
    file = path.resolve(__dirname, `../query-files/${file}.sql`)

    const query = this.connection.prepareSqlFile(`${file}`)

    return this.connection.connection[method](query, parameters)
  }

  /**
   * Reset the clauses.
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

  /**
   * Push the given clause to the given collection.
   * @param  {String} collection
   * @param  {Object} clause
   * @return {void}
   */
  __pushClause (collection, clause) {
    set(this, collection, get(this, collection).concat(clause))
  }
}
