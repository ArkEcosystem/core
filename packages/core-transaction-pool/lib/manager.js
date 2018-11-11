class TransactionPoolManager {
  /**
   * Create a new transaction pool manager instance.
   * @constructor
   */
  constructor() {
    this.connections = {}
  }

  /**
   * Get a transaction pool instance.
   * @param  {String} name
   * @return {TransactionPoolInterface}
   */
  connection(name = 'default') {
    return this.connections[name]
  }

  /**
   * Make the transaction pool instance.
   * @param  {TransactionPoolInterface} connection
   * @param  {String} name
   * @return {void}
   */
  async makeConnection(connection, name = 'default') {
    this.connections[name] = await connection.make()
  }
}

module.exports = new TransactionPoolManager()
