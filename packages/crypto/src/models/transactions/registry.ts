import { TransactionTypes } from "../../constants";
import { TransactionAlreadyRegisteredError, TransactionTypeNotRegisteredError } from "../../errors";
import { AbstractTransaction, Transaction, TransferTransaction } from "./transaction";

type TransactionConstructor = typeof AbstractTransaction;

class TransactionRegistry {
    private static readonly coreTypes = new Map<TransactionTypes, TransactionConstructor>();
    private static readonly customTypes = new Map<number, TransactionConstructor>();

    constructor() {
        this.registerCoreType(TransferTransaction);
    }

    public registerCustomTransactionType(transtransaction: Transaction): void {
        throw new Error("Not implemented");
    }

    public unregisterCustomTransactionType(transaction: number): void {
        throw new Error("Not implemented");
    }

    public get(type: TransactionTypes): typeof AbstractTransaction {
        if (TransactionRegistry.coreTypes.has(type)) {
            return TransactionRegistry.coreTypes.get(type);
        }

        throw new TransactionTypeNotRegisteredError(type);
    }

    private registerCoreType(constructor: typeof AbstractTransaction) {
        const type = constructor.getType();
        if (TransactionRegistry.coreTypes.has(type)) {
            throw new TransactionAlreadyRegisteredError(constructor.name);
        }

        TransactionRegistry.coreTypes.set(type, constructor);
    }
}

export const transactionRegistry = new TransactionRegistry();
