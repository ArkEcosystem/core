import { Engine } from "../engine";
import { transactions } from "../extensions/transactions";

export class TransactionValidator {
    public rules: any;

    constructor() {
        this.rules = Object.keys(transactions).reduce((rules, type) => {
            rules[type] = transactions[type](Engine.joi).base;
            return rules;
        }, {});
    }

    public validate(transaction) {
        const { value, error } = Engine.validate(transaction, this.rules[transaction.type], { allowUnknown: true });
        return {
            data: value,
            errors: error ? error.details : null,
            passes: !error,
            fails: error,
        };
    }
}

export const transactionValidator = new TransactionValidator();
