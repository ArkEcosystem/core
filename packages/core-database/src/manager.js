'use strict';

class DatabaseManager {
  constructor() {
    this.connections = {}
  }

  connection(name = 'default') {
    return this.connections[name];
  }

  async makeConnection(connection, name = 'default') {
    this.connections[name] = await connection.make()
  }
}

module.exports = new DatabaseManager()
