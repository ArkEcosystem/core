import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";
export declare class TransactionHandlerRegistry {
    private readonly registeredTransactionHandlers;
    private readonly knownWalletAttributes;
    constructor();
    getAll(): TransactionHandler[];
    get(type: number, typeGroup?: number): Promise<TransactionHandler>;
    getActivatedTransactionHandlers(): Promise<TransactionHandler[]>;
    registerTransactionHandler(constructor: TransactionHandlerConstructor): void;
    deregisterTransactionHandler(constructor: TransactionHandlerConstructor): void;
    isKnownWalletAttribute(attribute: string): boolean;
}
export declare const transactionHandlerRegistry: TransactionHandlerRegistry;
