const generateTransactions = require('../transactions')
const { TRANSACTION_TYPES } = require('../../../../client/lib/constants')

module.exports = (network, testWallet, testAddress, amount = 2, quantity = 10) => {
  return generateTransactions(
    network,
    TRANSACTION_TYPES.DELEGATE,
    testWallet,
    testAddress,
    amount,
    quantity
  )
}
