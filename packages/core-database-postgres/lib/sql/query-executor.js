module.exports = class QueryExecutor {
  /**
   * Create a new QueryExecutor instance.
   * @param  {[type]} connection
   * @return {QueryBuilder}
   */
  constructor (connection) {
    this.connection = connection
  }

  /**
   * Execute the given query and expect no results.
   * @param  {QueryFile} query
   * @param  {Array} parameters
   * @return {Promise}
   */
  async none (query, parameters) {
    return this.__executeQueryFile(query, parameters, 'none')
  }

  /**
   * Execute the given query and expect one result.
   * @param  {QueryFile} query
   * @param  {Array} parameters
   * @return {Promise}
   */
  async one (query, parameters) {
    return this.__executeQueryFile(query, parameters, 'one')
  }

  /**
   * Execute the given query and expect one or no results.
   * @param  {QueryFile} query
   * @param  {Array} parameters
   * @return {Promise}
   */
  async oneOrNone (query, parameters) {
    return this.__executeQueryFile(query, parameters, 'oneOrNone')
  }

  /**
   * Execute the given query and expect many results.
   * @param  {QueryFile} query
   * @param  {Array} parameters
   * @return {Promise}
   */
  async many (query, parameters) {
    return this.__executeQueryFile(query, parameters, 'many')
  }

  /**
   * Execute the given query and expect many or no results.
   * @param  {QueryFile} query
   * @param  {Array} parameters
   * @return {Promise}
   */
  async manyOrNone (query, parameters) {
    return this.__executeQueryFile(query, parameters, 'manyOrNone')
  }

  /**
   * Execute the given query and expect any results.
   * @param  {QueryFile} query
   * @param  {Array} parameters
   * @return {Promise}
   */
  async any (query, parameters) {
    return this.__executeQueryFile(query, parameters, 'any')
  }

  /**
   * Execute the given query using the given method and parameters.
   * @param  {QueryFile} query
   * @param  {Array} parameters
   * @param  {String} method
   * @return {QueryBuilder}
   */
  async __executeQueryFile (query, parameters, method) {
    return this.connection.db[method](query, parameters)
  }
}
