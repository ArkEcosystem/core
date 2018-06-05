const generateTransactions = require('../transactions')
const { TRANSACTION_TYPES } = require('../../../../crypto/lib/constants')

module.exports = (network, testWallet, testAddress, amount = 2, quantity = 10) => {
  return generateTransactions(
    network,
    TRANSACTION_TYPES.TRANSFER,
    testWallet,
    testAddress,
    amount,
    quantity
  )
}
