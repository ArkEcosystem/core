const engine = require('../engine')
const transactionExtensions = require('../extensions/transactions/index')

class TransactionValidator {
  constructor() {
    this.rules = Object.keys(transactionExtensions).reduce((rules, type) => {
      rules[type] = transactionExtensions[type](engine.joi).base
      return rules
    }, {})
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
