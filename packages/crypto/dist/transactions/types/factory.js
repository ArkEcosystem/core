"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../errors");
const internal_transaction_type_1 = require("./internal-transaction-type");
class TransactionTypeFactory {
    static initialize(transactionTypes) {
        this.transactionTypes = transactionTypes;
    }
    static create(data) {
        const instance = new (this.get(data.type, data.typeGroup))();
        instance.data = data;
        instance.data.version = data.version || 1;
        return instance;
    }
    static get(type, typeGroup) {
        const internalType = internal_transaction_type_1.InternalTransactionType.from(type, typeGroup);
        if (this.transactionTypes.has(internalType)) {
            return this.transactionTypes.get(internalType);
        }
        throw new errors_1.UnkownTransactionError(internalType.toString());
    }
}
exports.TransactionTypeFactory = TransactionTypeFactory;
//# sourceMappingURL=factory.js.map