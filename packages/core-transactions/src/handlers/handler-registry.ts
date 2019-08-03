import { Enums, Errors, Transactions } from "@arkecosystem/crypto";

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
    private readonly registeredTransactionHandlers: Map<
        Transactions.InternalTransactionType,
        TransactionHandler
    > = new Map();

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

    public get(type: number, typeGroup?: number): TransactionHandler {
        const internalType: Transactions.InternalTransactionType = Transactions.InternalTransactionType.from(
            type,
            typeGroup,
        );
        if (this.registeredTransactionHandlers.has(internalType)) {
            return this.registeredTransactionHandlers.get(internalType);
        }

        throw new InvalidTransactionTypeError(internalType.toString());
    }

    public async getActivatedTransactions(): Promise<TransactionHandler[]> {
        const activatedTransactions: TransactionHandler[] = [];

        for (const handler of this.registeredTransactionHandlers.values()) {
            if (await handler.isActivated()) {
                activatedTransactions.push(handler);
            }
        }

        return activatedTransactions;
    }

    public registerTransactionHandler(constructor: TransactionHandlerConstructor) {
        const service: TransactionHandler = new constructor();
        const transactionConstructor = service.getConstructor();
        const { typeGroup, type } = transactionConstructor;

        for (const dependency of service.dependencies()) {
            this.registerTransactionHandler(dependency);
        }

        const internalType: Transactions.InternalTransactionType = Transactions.InternalTransactionType.from(
            type,
            typeGroup,
        );
        if (this.registeredTransactionHandlers.has(internalType)) {
            return;
        }

        if (!(type in Enums.TransactionType)) {
            Transactions.TransactionRegistry.registerTransactionType(transactionConstructor);
        }

        this.registeredTransactionHandlers.set(internalType, service);
    }

    public deregisterTransactionHandler(constructor: TransactionHandlerConstructor): void {
        const service: TransactionHandler = new constructor();
        const transactionConstructor = service.getConstructor();
        const { typeGroup, type } = transactionConstructor;

        if (typeGroup === Enums.TransactionTypeGroup.Core || typeGroup === undefined) {
            throw new Errors.CoreTransactionTypeGroupImmutableError();
        }

        const internalType: Transactions.InternalTransactionType = Transactions.InternalTransactionType.from(
            type,
            typeGroup,
        );
        if (!this.registeredTransactionHandlers.has(internalType)) {
            throw new InvalidTransactionTypeError(internalType.toString());
        }

        Transactions.TransactionRegistry.deregisterTransactionType(transactionConstructor);
        this.registeredTransactionHandlers.delete(internalType);
    }
}

export const transactionHandlerRegistry = new TransactionHandlerRegistry();
