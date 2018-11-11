class DatabaseManager {
  /**
   * Create a new database manager instance.
   * @constructor
   */
  constructor() {
    this.connections = {}
  }

  /**
   * Get a database connection instance.
   * @param  {String} name
   * @return {ConnectionInterface}
   */
  connection(name = 'default') {
    return this.connections[name]
  }

  /**
   * Make the database connection instance.
   * @param  {ConnectionInterface} connection
   * @param  {String} name
   * @return {void}
   */
  async makeConnection(connection, name = 'default') {
    this.connections[name] = await connection.make()
  }
}

module.exports = new DatabaseManager()
