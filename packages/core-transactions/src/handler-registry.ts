import { constants, TransactionRegistry } from "@arkecosystem/crypto";
import { InvalidTransactionTypeError, TransactionHandlerAlreadyRegisteredError } from "./errors";
import { transactionHandlers } from "./handlers";
import { TransactionHandler } from "./handlers/transaction";

export type TransactionHandlerConstructor = new () => TransactionHandler;

class TransactionHandlerRegistry {
    private readonly coreTransactionHandlers = new Map<constants.TransactionTypes, TransactionHandler>();
    private readonly customTransactionHandlers = new Map<number, TransactionHandler>();

    constructor() {
        transactionHandlers.forEach((service: TransactionHandlerConstructor) => {
            this.registerCoreTransactionHandler(service);
        });
    }

    public get(type: constants.TransactionTypes | number): TransactionHandler {
        if (this.coreTransactionHandlers.has(type)) {
            return this.coreTransactionHandlers.get(type);
        }

        if (this.customTransactionHandlers.has(type)) {
            return this.customTransactionHandlers.get(type);
        }

        throw new InvalidTransactionTypeError(type);
    }

    public registerCustomTransactionHandler(constructor: TransactionHandlerConstructor): void {
        const service = new constructor();
        const transactionConstructor = service.getConstructor();
        const { type } = transactionConstructor;

        if (this.customTransactionHandlers.has(type)) {
            throw new TransactionHandlerAlreadyRegisteredError(type);
        }

        TransactionRegistry.registerCustomType(transactionConstructor);

        this.customTransactionHandlers.set(type, service);
    }

    public deregisterCustomTransactionHandler(type: number): void {
        if (this.customTransactionHandlers.has(type)) {
            TransactionRegistry.deregisterCustomType(type);
            this.customTransactionHandlers.delete(type);
        }
    }

    private registerCoreTransactionHandler(constructor: TransactionHandlerConstructor) {
        const service = new constructor();
        const transactionConstructor = service.getConstructor();
        const { type } = transactionConstructor;

        if (this.coreTransactionHandlers.has(type)) {
            throw new TransactionHandlerAlreadyRegisteredError(type);
        }

        this.coreTransactionHandlers.set(type, service);
    }
}

export const transactionHandlerRegistry = new TransactionHandlerRegistry();
