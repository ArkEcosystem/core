import { Enums, Transactions } from "@arkecosystem/crypto";

import { DelegateRegistrationTransactionHandler } from "./delegate-registration";
import { DelegateResignationTransactionHandler } from "./delegate-resignation";
import { HtlcClaimTransactionHandler } from "./htlc-claim";
import { HtlcLockTransactionHandler } from "./htlc-lock";
import { HtlcRefundTransactionHandler } from "./htlc-refund";
import { IpfsTransactionHandler } from "./ipfs";
import { MultiPaymentTransactionHandler } from "./multi-payment";
import { MultiSignatureTransactionHandler } from "./multi-signature";
import { SecondSignatureTransactionHandler } from "./second-signature";
import { TransferTransactionHandler } from "./transfer";
import { VoteTransactionHandler } from "./vote";

import { InvalidTransactionTypeError } from "../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

export class TransactionHandlerRegistry {
    private readonly registeredTransactionHandlers: Map<number, TransactionHandler> = new Map<
        Enums.TransactionTypes,
        TransactionHandler
    >();

    constructor() {
        this.registerTransactionHandler(TransferTransactionHandler);
        this.registerTransactionHandler(SecondSignatureTransactionHandler);
        this.registerTransactionHandler(DelegateRegistrationTransactionHandler);
        this.registerTransactionHandler(VoteTransactionHandler);
        this.registerTransactionHandler(MultiSignatureTransactionHandler);
        this.registerTransactionHandler(IpfsTransactionHandler);
        this.registerTransactionHandler(MultiPaymentTransactionHandler);
        this.registerTransactionHandler(DelegateResignationTransactionHandler);
        this.registerTransactionHandler(HtlcLockTransactionHandler);
        this.registerTransactionHandler(HtlcClaimTransactionHandler);
        this.registerTransactionHandler(HtlcRefundTransactionHandler);
    }

    public get(type: Enums.TransactionTypes | number): TransactionHandler {
        if (this.registeredTransactionHandlers.has(type)) {
            return this.registeredTransactionHandlers.get(type);
        }

        throw new InvalidTransactionTypeError(type);
    }

    public all(): TransactionHandler[] {
        return [...this.registeredTransactionHandlers.values()];
    }

    public registerTransactionHandler(constructor: TransactionHandlerConstructor) {
        const service: TransactionHandler = new constructor();
        const transactionConstructor = service.getConstructor();
        const { type } = transactionConstructor;

        for (const dependency of service.dependencies()) {
            this.registerTransactionHandler(dependency);
        }

        if (this.registeredTransactionHandlers.has(type)) {
            return;
        }

        this.registeredTransactionHandlers.set(type, service);
    }

    public deregisterTransactionHandler(constructor: TransactionHandlerConstructor): void {
        const service: TransactionHandler = new constructor();
        const transactionConstructor = service.getConstructor();
        const { type } = transactionConstructor;

        if (type in Enums.TransactionTypes) {
            throw new Error("Cannot deregister Core transaction.");
        }

        if (!this.registeredTransactionHandlers.has(type)) {
            throw new InvalidTransactionTypeError(type);
        }

        Transactions.TransactionRegistry.deregisterTransactionType(type);
        this.registeredTransactionHandlers.delete(type);
    }
}

export const transactionHandlerRegistry = new TransactionHandlerRegistry();
