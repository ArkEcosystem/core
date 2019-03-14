import { constants, TransactionRegistry } from "@arkecosystem/crypto";
import { InvalidTransactionTypeError, TransactionServiceAlreadyRegisteredError } from "./errors";
import { transactionServices } from "./services";
import { TransactionService } from "./services/transaction";

export type TransactionServiceConstructor = new () => TransactionService;

class TransactionServiceRegistry {
    private readonly coreTransactionServices = new Map<constants.TransactionTypes, TransactionService>();
    private readonly customTransactionServices = new Map<number, TransactionService>();

    constructor() {
        transactionServices.forEach((service: TransactionServiceConstructor) => {
            this.registerCoreTransactionService(service);
        });
    }

    public get(type: constants.TransactionTypes | number): TransactionService {
        if (this.coreTransactionServices.has(type)) {
            return this.coreTransactionServices.get(type);
        }

        if (this.customTransactionServices.has(type)) {
            return this.customTransactionServices.get(type);
        }

        throw new InvalidTransactionTypeError(type);
    }

    public registerCustomTransactionService(constructor: TransactionServiceConstructor): void {
        const service = new constructor();
        const transactionConstructor = service.getConstructor();
        const { type } = transactionConstructor;

        if (this.customTransactionServices.has(type)) {
            throw new TransactionServiceAlreadyRegisteredError(type);
        }

        TransactionRegistry.registerCustomType(transactionConstructor);

        this.customTransactionServices.set(type, service);
    }

    public deregisterCustomTransactionService(type: number): void {
        if (this.customTransactionServices.has(type)) {
            TransactionRegistry.deregisterCustomType(type);
            this.customTransactionServices.delete(type);
        }
    }

    private registerCoreTransactionService(constructor: TransactionServiceConstructor) {
        const service = new constructor();
        const transactionConstructor = service.getConstructor();
        const { type } = transactionConstructor;

        if (this.coreTransactionServices.has(type)) {
            throw new TransactionServiceAlreadyRegisteredError(type);
        }

        this.coreTransactionServices.set(type, service);
    }
}

export const transactionServiceRegistry = new TransactionServiceRegistry();
