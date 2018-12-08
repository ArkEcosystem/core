import engine from "../engine"
import transactionExtensions from "../extensions/transactions/index"

export class TransactionValidator {
  public rules: any;

  constructor() {
    this.rules = Object.keys(transactionExtensions).reduce((rules, type) => {
      rules[type] = transactionExtensions[type](engine.joi).base;
      return rules;
    }, {});
  }

  public validate(transaction) {
    const { value, error } = engine.validate(
      transaction,
      this.rules[transaction.type],
      { allowUnknown: true }
    );
    return {
      data: value,
      errors: error ? error.details : null,
      passes: !error,
      fails: error
    };
  }
}

export default new TransactionValidator();
