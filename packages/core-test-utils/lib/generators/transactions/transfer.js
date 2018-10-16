const generateTransactions = require('./transaction')
const { TRANSACTION_TYPES } = require('../../../../crypto/lib/constants')

module.exports = (network, passphrase, address, amount = 2, quantity = 10, getStruct = false) => {
  return generateTransactions(
    network,
    TRANSACTION_TYPES.TRANSFER,
    passphrase,
    address,
    amount,
    quantity,
    getStruct
  )
}
