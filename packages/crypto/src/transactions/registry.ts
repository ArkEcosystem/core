import { TransactionTypes } from "../enums";
import { TransactionAlreadyRegisteredError, TransactionTypeInvalidRangeError } from "../errors";
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
    private readonly coreTypes: Map<TransactionTypes, TransactionConstructor> = new Map<
        TransactionTypes,
        TransactionConstructor
    >();
    private readonly customTypes: Map<number, TransactionConstructor> = new Map<number, TransactionConstructor>();

    constructor() {
        TransactionTypeFactory.initialize(this.coreTypes, this.customTypes);

        this.registerCoreType(TransferTransaction);
        this.registerCoreType(SecondSignatureRegistrationTransaction);
        this.registerCoreType(DelegateRegistrationTransaction);
        this.registerCoreType(VoteTransaction);
        this.registerCoreType(MultiSignatureRegistrationTransaction);
        this.registerCoreType(IpfsTransaction);
        this.registerCoreType(MultiPaymentTransaction);
        this.registerCoreType(DelegateResignationTransaction);
        this.registerCoreType(HtlcLockTransaction);
        this.registerCoreType(HtlcClaimTransaction);
        this.registerCoreType(HtlcRefundTransaction);
    }

    public registerCustomType(constructor: TransactionConstructor): void {
        const { type } = constructor;
        if (this.customTypes.has(type)) {
            throw new TransactionAlreadyRegisteredError(constructor.name);
        }

        if (type < 100) {
            throw new TransactionTypeInvalidRangeError(type);
        }

        this.customTypes.set(type, constructor);
        this.updateSchemas(constructor);
    }

    public deregisterCustomType(type: number): void {
        if (this.customTypes.has(type)) {
            const schema = this.customTypes.get(type);
            this.updateSchemas(schema, true);
            this.customTypes.delete(type);
        }
    }

    private registerCoreType(constructor: TransactionConstructor): void {
        const { type } = constructor;
        if (this.coreTypes.has(type)) {
            throw new TransactionAlreadyRegisteredError(constructor.name);
        }

        this.coreTypes.set(type, constructor);
        this.updateSchemas(constructor);
    }

    private updateSchemas(transaction: TransactionConstructor, remove?: boolean): void {
        validator.extendTransaction(transaction.getSchema(), remove);
    }
}

export const transactionRegistry = new TransactionRegistry();
