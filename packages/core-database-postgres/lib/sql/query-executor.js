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
   * @param  {QueryFile} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async none (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'none')
  }

  /**
   * Execute the given query and expect one result.
   * @param  {QueryFile} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async one (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'one')
  }

  /**
   * Execute the given query and expect one or no results.
   * @param  {QueryFile} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async oneOrNone (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'oneOrNone')
  }

  /**
   * Execute the given query and expect many results.
   * @param  {QueryFile} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async many (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'many')
  }

  /**
   * Execute the given query and expect many or no results.
   * @param  {QueryFile} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async manyOrNone (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'manyOrNone')
  }

  /**
   * Execute the given query and expect any results.
   * @param  {QueryFile} file
   * @param  {Array} parameters
   * @return {Promise}
   */
  async any (file, parameters) {
    return this.__executeQueryFile(file, parameters, 'any')
  }

  /**
   * Execute the given query using the given method and parameters.
   * @param  {QueryFile} file
   * @param  {Array} parameters
   * @param  {String} method
   * @return {QueryBuilder}
   */
  async __executeQueryFile (file, parameters, method) {
    return this.connection.db[method](file, parameters)
  }
}
