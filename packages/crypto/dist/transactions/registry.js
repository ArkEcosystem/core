"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("../enums");
const errors_1 = require("../errors");
const validation_1 = require("../validation");
const types_1 = require("./types");
const internal_transaction_type_1 = require("./types/internal-transaction-type");
class TransactionRegistry {
    constructor() {
        this.transactionTypes = new Map();
        types_1.TransactionTypeFactory.initialize(this.transactionTypes);
        this.registerTransactionType(types_1.TransferTransaction);
        this.registerTransactionType(types_1.SecondSignatureRegistrationTransaction);
        this.registerTransactionType(types_1.DelegateRegistrationTransaction);
        this.registerTransactionType(types_1.VoteTransaction);
        this.registerTransactionType(types_1.MultiSignatureRegistrationTransaction);
        this.registerTransactionType(types_1.IpfsTransaction);
        this.registerTransactionType(types_1.MultiPaymentTransaction);
        this.registerTransactionType(types_1.DelegateResignationTransaction);
        this.registerTransactionType(types_1.HtlcLockTransaction);
        this.registerTransactionType(types_1.HtlcClaimTransaction);
        this.registerTransactionType(types_1.HtlcRefundTransaction);
        // registering multisignature legacy schema separate after splitting the main
        // multisignature schema into current implementation and legacy
        validation_1.validator.extendTransaction(types_1.schemas.multiSignatureLegacy, false);
    }
    registerTransactionType(constructor) {
        const { typeGroup, type } = constructor;
        const internalType = internal_transaction_type_1.InternalTransactionType.from(type, typeGroup);
        if (this.transactionTypes.has(internalType)) {
            throw new errors_1.TransactionAlreadyRegisteredError(constructor.name);
        }
        if (Array.from(this.transactionTypes.values()).some(({ key }) => key === constructor.key)) {
            throw new errors_1.TransactionKeyAlreadyRegisteredError(constructor.key);
        }
        this.transactionTypes.set(internalType, constructor);
        this.updateSchemas(constructor);
    }
    deregisterTransactionType(constructor) {
        const { typeGroup, type } = constructor;
        const internalType = internal_transaction_type_1.InternalTransactionType.from(type, typeGroup);
        if (!this.transactionTypes.has(internalType)) {
            throw new errors_1.UnkownTransactionError(internalType.toString());
        }
        if (typeGroup === enums_1.TransactionTypeGroup.Core) {
            throw new errors_1.CoreTransactionTypeGroupImmutableError();
        }
        const schema = this.transactionTypes.get(internalType);
        this.updateSchemas(schema, true);
        this.transactionTypes.delete(internalType);
    }
    updateSchemas(transaction, remove) {
        validation_1.validator.extendTransaction(transaction.getSchema(), remove);
    }
}
exports.transactionRegistry = new TransactionRegistry();
//# sourceMappingURL=registry.js.map