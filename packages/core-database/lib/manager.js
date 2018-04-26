'use strict';

class DatabaseManager {
  /**
   * [constructor description]
   */
  constructor () {
    this.connections = {}
  }

  /**
   * [connection description]
   * @param  {String} name
   * @return {ConnectionInterface}
   */
  connection (name = 'default') {
    return this.connections[name]
  }

  /**
   * [makeConnection description]
   * @param  {ConnectionInterface} connection
   * @param  {String} name
   * @return {void}
   */
  async makeConnection (connection, name = 'default') {
    this.connections[name] = await connection.make()
  }
}

module.exports = new DatabaseManager()
