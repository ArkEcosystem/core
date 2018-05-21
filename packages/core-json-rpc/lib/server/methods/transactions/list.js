const database = require('../../services/database')

module.exports = {
  name: 'transactions.list',
  method: async (params) => {
    return database.get('transactions')
  }
}
