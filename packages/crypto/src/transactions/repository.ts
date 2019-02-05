import { TransactionTypes } from "../constants";
import { NotImplementedError, TransactionAlreadyRegisteredError, TransactionTypeNotRegisteredError } from "../errors";
import { ITransactionData } from "./interfaces";
import {
    AbstractTransaction,
    DelegateRegistrationTransaction,
    DelegateResignationTransaction,
    IpfsTransaction,
    MultiPaymentTransaction,
    MultiSignatureRegistrationTransaction,
    SecondSignatureRegistrationTransaction,
    TimelockTransferTransaction,
    TransferTransaction,
    VoteTransaction,
} from "./types";

type TransactionConstructor = typeof AbstractTransaction;

class TransactionRepository {
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

    public create(data: ITransactionData): AbstractTransaction {
        const instance = new (this.get(data.type) as any)() as AbstractTransaction;
        instance.data = data;

        return instance;
    }

    public get(type: TransactionTypes): TransactionConstructor {
        if (this.coreTypes.has(type)) {
            return this.coreTypes.get(type);
        }

        throw new TransactionTypeNotRegisteredError(type);
    }

    public registerCustomTransactionType(constructor: TransactionConstructor): void {
        throw new NotImplementedError();
    }

    public unregisterCustomTransactionType(constructor: TransactionConstructor): void {
        throw new NotImplementedError();
    }

    private registerCoreType(constructor: TransactionConstructor) {
        const type = constructor.getType();
        if (this.coreTypes.has(type)) {
            throw new TransactionAlreadyRegisteredError(constructor.name);
        }

        this.coreTypes.set(type, constructor);
    }
}

export const transactionRepository = new TransactionRepository();
