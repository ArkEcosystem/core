const engine = require('../engine')

const { TRANSACTION_TYPES } = require('../../constants')
const transactionExtensions = require('../extensions/transactions')

class TransactionValidator {
  constructor() {
    transactionExtensions.forEach(extension => {})
    this.rules = {
      [TRANSACTION_TYPES.TRANSFER]: engine.joi.arkTransfer(),
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: engine.joi.arkTransfer(),
    }
  }

  validate(transaction) {
    const { value, error } = engine.validate(
      transaction,
      this.rules[transaction.type],
      { allowUnknown: true },
    )
    return {
      data: value,
      errors: error ? error.details : null,
      passes: !error,
      fails: error,
    }
  }
}

module.exports = new TransactionValidator()
