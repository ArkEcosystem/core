const database = require('../../services/database')

module.exports = {
  name: 'transactions.list',
  method: async (params) => {
    const transactions = await database.get('transactions')

    return transactions
  }
}
