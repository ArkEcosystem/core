const generateTransactions = require('./transaction')
const { TRANSACTION_TYPES } = require('../../../../crypto/lib/constants')

module.exports = (network, passphrase, quantity = 10, getStruct = false) => {
  return generateTransactions(
    network,
    TRANSACTION_TYPES.SECOND_SIGNATURE,
    passphrase,
    undefined,
    undefined,
    quantity,
    getStruct
  )
}
