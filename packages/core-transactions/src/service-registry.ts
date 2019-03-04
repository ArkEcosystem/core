import { constants } from "@arkecosystem/crypto";
import { InvalidTransactionTypeError, NotImplementedError, TransactionServiceAlreadyRegisteredError } from "./errors";
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

    public get(type: constants.TransactionTypes): TransactionService {
        if (!this.coreTransactionServices.has(type)) {
            throw new InvalidTransactionTypeError(type);
        }

        return this.coreTransactionServices.get(type);
    }

    public registerCustomTransactionService(service: TransactionServiceConstructor): void {
        throw new NotImplementedError();
    }

    public deregisterCustomTransactionService(service: TransactionServiceConstructor): void {
        throw new NotImplementedError();
    }

    private registerCoreTransactionService(constructor: TransactionServiceConstructor) {
        const service = new constructor();
        const type = service.getType();

        if (this.coreTransactionServices.has(type)) {
            throw new TransactionServiceAlreadyRegisteredError(type);
        }

        this.coreTransactionServices.set(type, service);
    }
}

export const transactionServiceRegistry = new TransactionServiceRegistry();
