const engine = require('../engine')
const { TRANSACTION_TYPES } = require('../../constants')
const transactionExtensions = require('../extensions/transactions')

class TransactionValidator {
  constructor() {
    this.rules = {
      [TRANSACTION_TYPES.TRANSFER]: transactionExtensions.transfer(engine.joi),
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: transactionExtensions.secondSignature(
        engine.joi,
      ),
      [TRANSACTION_TYPES.DELEGATE_REGISTRATION]: transactionExtensions.delegateRegistration(
        engine.joi,
      ),
      [TRANSACTION_TYPES.VOTE]: transactionExtensions.vote(engine.joi),
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: transactionExtensions.multiSignature(
        engine.joi,
      ),
      [TRANSACTION_TYPES.IPFS]: transactionExtensions.ipfs(engine.joi),
      [TRANSACTION_TYPES.TIMELOCK_TRANSFER]: transactionExtensions.timelockTransfer(
        engine.joi,
      ),
      [TRANSACTION_TYPES.MULTI_PAYMENT]: transactionExtensions.multiPayment(
        engine.joi,
      ),
      [TRANSACTION_TYPES.DELEGATE_RESIGNATION]: transactionExtensions.delegateResignation(
        engine.joi,
      ),
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
