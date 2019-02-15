import { TransactionTypes } from "../constants";
import { NotImplementedError, TransactionAlreadyRegisteredError, UnkownTransactionError } from "../errors";
import { AjvWrapper } from "../validation";
import { ITransactionData } from "./interfaces";
import {
    DelegateRegistrationTransaction,
    DelegateResignationTransaction,
    IpfsTransaction,
    MultiPaymentTransaction,
    MultiSignatureRegistrationTransaction,
    SecondSignatureRegistrationTransaction,
    TimelockTransferTransaction,
    Transaction,
    TransferTransaction,
    VoteTransaction,
} from "./types";

type TransactionConstructor = typeof Transaction;

class TransactionRegistry {
    private readonly coreTypes = new Map<TransactionTypes, TransactionConstructor>();
    private readonly customTypes = new Map<number, TransactionConstructor>();

    constructor() {
        this.registerCoreType(TransferTransaction);
        this.registerCoreType(SecondSignatureRegistrationTransaction);
        this.registerCoreType(DelegateRegistrationTransaction);
        this.registerCoreType(VoteTransaction);
        this.registerCoreType(MultiSignatureRegistrationTransaction);
        this.registerCoreType(IpfsTransaction);
        this.registerCoreType(TimelockTransferTransaction);
        this.registerCoreType(MultiPaymentTransaction);
        this.registerCoreType(DelegateResignationTransaction);
    }

    public create(data: ITransactionData): Transaction {
        const instance = new (this.get(data.type) as any)() as Transaction;
        instance.data = data;

        return instance;
    }

    public get(type: TransactionTypes): TransactionConstructor {
        if (this.coreTypes.has(type)) {
            return this.coreTypes.get(type);
        }

        throw new UnkownTransactionError(type);
    }

    public registerCustomTransactionType(constructor: TransactionConstructor): void {
        throw new NotImplementedError();
    }

    public unregisterCustomTransactionType(constructor: TransactionConstructor): void {
        throw new NotImplementedError();
    }

    private registerCoreType(constructor: TransactionConstructor) {
        const { type } = constructor;
        if (this.coreTypes.has(type)) {
            throw new TransactionAlreadyRegisteredError(constructor.name);
        }

        this.coreTypes.set(type, constructor);
        this.updateSchemas(constructor);
    }

    private updateSchemas(transactionClass: TransactionConstructor) {
        const schema = transactionClass.getSchema();
        AjvWrapper.extendTransaction(schema);
    }
}

export const transactionRegistry = new TransactionRegistry();
