const { loadQueryFile } = require('../utils')

module.exports = [
  loadQueryFile(__dirname, './20180305100000-create-wallets-table.sql'),
  loadQueryFile(__dirname, './20180305200000-create-rounds-table.sql'),
  loadQueryFile(__dirname, './20180305300000-create-blocks-table.sql'),
  loadQueryFile(__dirname, './20180305400000-create-transactions-table.sql')
]
