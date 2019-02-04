import { TransactionTypes } from "../../constants";
import { TransactionAlreadyRegisteredError } from "../../errors";
import { AbstractTransaction, Transaction, TransferTransaction } from "./transaction";

type TransactionConstructor = new () => AbstractTransaction;

export class TransactionRegistry {
    private static readonly coreTypes = new Map<TransactionTypes, TransactionConstructor>();
    private static readonly customTypes = new Map<number, TransactionConstructor>();

    public constructor() {
        this.registerCoreType(TransferTransaction);
    }
    public registerCustomTransactionType(transtransaction: Transaction): void {
        //
    }

    private registerCoreType(constructor: typeof AbstractTransaction) {
        const type = constructor.getType();
        if (TransactionRegistry.coreTypes.has(type)) {
            throw new TransactionAlreadyRegisteredError(constructor.name);
        }

        //    TransactionRegistry.coreTypes.set(type, constructor.prototype);
    }
}
