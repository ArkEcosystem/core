import { transactions } from "../extensions/transactions";
import { Validator } from "../validator";

export class TransactionValidator {
    public rules: any;

    constructor() {
        this.rules = Object.keys(transactions).reduce((rules, type) => {
            rules[type] = transactions[type](Validator.joi).base;
            return rules;
        }, {});
    }

    public validate(transaction) {
        const { value, error } = Validator.validate(transaction, this.rules[transaction.type], { allowUnknown: true });
        return {
            data: value,
            errors: error ? error.details : null,
            passes: !error,
            fails: error,
        };
    }
}

export const transactionValidator = new TransactionValidator();
