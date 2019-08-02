import { TransactionTypes } from "../enums";
import { TransactionAlreadyRegisteredError } from "../errors";
import { validator } from "../validation";
import {
    DelegateRegistrationTransaction,
    DelegateResignationTransaction,
    HtlcClaimTransaction,
    HtlcLockTransaction,
    HtlcRefundTransaction,
    IpfsTransaction,
    MultiPaymentTransaction,
    MultiSignatureRegistrationTransaction,
    SecondSignatureRegistrationTransaction,
    Transaction,
    TransactionTypeFactory,
    TransferTransaction,
    VoteTransaction,
} from "./types";

export type TransactionConstructor = typeof Transaction;

class TransactionRegistry {
    private readonly transactionTypes: Map<number, TransactionConstructor> = new Map<
        TransactionTypes,
        TransactionConstructor
    >();

    constructor() {
        TransactionTypeFactory.initialize(this.transactionTypes);

        this.registerTransactionType(TransferTransaction);
        this.registerTransactionType(SecondSignatureRegistrationTransaction);
        this.registerTransactionType(DelegateRegistrationTransaction);
        this.registerTransactionType(VoteTransaction);
        this.registerTransactionType(MultiSignatureRegistrationTransaction);
        this.registerTransactionType(IpfsTransaction);
        this.registerTransactionType(MultiPaymentTransaction);
        this.registerTransactionType(DelegateResignationTransaction);
        this.registerTransactionType(HtlcLockTransaction);
        this.registerTransactionType(HtlcClaimTransaction);
        this.registerTransactionType(HtlcRefundTransaction);
    }

    public registerTransactionType(constructor: TransactionConstructor): void {
        const { type } = constructor;
        if (this.transactionTypes.has(type)) {
            throw new TransactionAlreadyRegisteredError(constructor.name);
        }

        this.transactionTypes.set(type, constructor);
        this.updateSchemas(constructor);
    }

    public deregisterTransactionType(type: number): void {
        if (!this.transactionTypes.has(type)) {
            throw new TransactionAlreadyRegisteredError(this.transactionTypes.get(type).constructor.name);
        }

        if (type in TransactionTypes) {
            throw new Error("Cannot deregister Core type.");
        }

        const schema = this.transactionTypes.get(type);
        this.updateSchemas(schema, true);
        this.transactionTypes.delete(type);
    }

    private updateSchemas(transaction: TransactionConstructor, remove?: boolean): void {
        validator.extendTransaction(transaction.getSchema(), remove);
    }
}

export const transactionRegistry = new TransactionRegistry();
