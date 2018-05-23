const database = require('../../services/database')

module.exports = {
  name: 'transactions.list',
  async method (params) {
    return database.get('transactions')
  }
}
