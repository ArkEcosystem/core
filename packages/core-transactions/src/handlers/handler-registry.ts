import { Enums, Transactions } from "@arkecosystem/crypto";
import { transactionHandlers } from ".";
import { InvalidTransactionTypeError, TransactionHandlerAlreadyRegisteredError } from "../errors";
import { TransactionHandler } from "./transaction";

export type TransactionHandlerConstructor = new () => TransactionHandler;

export class TransactionHandlerRegistry {
    private readonly coreTransactionHandlers: Map<Enums.TransactionTypes, TransactionHandler> = new Map<
        Enums.TransactionTypes,
        TransactionHandler
    >();
    private readonly customTransactionHandlers: Map<number, TransactionHandler> = new Map<number, TransactionHandler>();

    constructor() {
        transactionHandlers.forEach((service: TransactionHandlerConstructor) => {
            this.registerCoreTransactionHandler(service);
        });
    }

    public get(type: Enums.TransactionTypes | number): TransactionHandler {
        if (this.coreTransactionHandlers.has(type)) {
            return this.coreTransactionHandlers.get(type);
        }

        if (this.customTransactionHandlers.has(type)) {
            return this.customTransactionHandlers.get(type);
        }

        throw new InvalidTransactionTypeError(type);
    }

    public registerCustomTransactionHandler(constructor: TransactionHandlerConstructor): void {
        const service: TransactionHandler = new constructor();
        const transactionConstructor = service.getConstructor();
        const { type } = transactionConstructor;

        if (this.customTransactionHandlers.has(type)) {
            throw new TransactionHandlerAlreadyRegisteredError(type);
        }

        Transactions.TransactionRegistry.registerCustomType(transactionConstructor);

        this.customTransactionHandlers.set(type, service);
    }

    public deregisterCustomTransactionHandler(constructor: TransactionHandlerConstructor): void {
        const service: TransactionHandler = new constructor();
        const transactionConstructor = service.getConstructor();
        const { type } = transactionConstructor;

        if (this.customTransactionHandlers.has(type)) {
            Transactions.TransactionRegistry.deregisterCustomType(type);
            this.customTransactionHandlers.delete(type);
        }
    }

    private registerCoreTransactionHandler(constructor: TransactionHandlerConstructor) {
        const service: TransactionHandler = new constructor();
        const transactionConstructor = service.getConstructor();
        const { type } = transactionConstructor;

        if (this.coreTransactionHandlers.has(type)) {
            throw new TransactionHandlerAlreadyRegisteredError(type);
        }

        this.coreTransactionHandlers.set(type, service);
    }
}

export const transactionHandlerRegistry = new TransactionHandlerRegistry();
