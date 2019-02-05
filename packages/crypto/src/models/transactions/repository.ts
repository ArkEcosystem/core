import { TransactionTypes } from "../../constants";
import {
    NotImplementedError,
    TransactionAlreadyRegisteredError,
    TransactionTypeNotRegisteredError,
} from "../../errors";
import { AbstractTransaction, TransferTransaction } from "./types";

type TransactionConstructor = typeof AbstractTransaction;

class TransactionRepository {
    private readonly coreTypes = new Map<TransactionTypes, TransactionConstructor>();
    private readonly customTypes = new Map<number, TransactionConstructor>();

    constructor() {
        this.registerCoreType(TransferTransaction);
        // TODO: register remaining core types.
    }

    public get(type: TransactionTypes): AbstractTransaction {
        if (this.coreTypes.has(type)) {
            return (this.coreTypes.get(type) as any) as AbstractTransaction;
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
