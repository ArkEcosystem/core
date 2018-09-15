const { TRANSACTION_TYPES } = require('../../constants')

class TransactionValidator {
  constructor () {
    this.rules = {
      [TRANSACTION_TYPES.TRANSFER]: require('../rules/models/transactions/transfer'),
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: require('../rules/models/transactions/second-signature'),
      [TRANSACTION_TYPES.DELEGATE_REGISTRATION]: require('../rules/models/transactions/delegate-registration'),
      [TRANSACTION_TYPES.VOTE]: require('../rules/models/transactions/vote'),
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: require('../rules/models/transactions/multi-signature'),
      [TRANSACTION_TYPES.IPFS]: require('../rules/models/transactions/ipfs'),
      [TRANSACTION_TYPES.TIMELOCK_TRANSFER]: require('../rules/models/transactions/timelock-transfer'),
      [TRANSACTION_TYPES.MULTI_PAYMENT]: require('../rules/models/transactions/multi-payment'),
      [TRANSACTION_TYPES.DELEGATE_RESIGNATION]: require('../rules/models/transactions/delegate-resignation')
    }
  }

  validate (transaction) {
    return this.rules[transaction.type](transaction)
  }
}

module.exports = new TransactionValidator()
