import { Enums, Errors, Transactions } from "@arkecosystem/crypto";

import assert from "assert";
import { DeactivatedTransactionHandlerError, InvalidTransactionTypeError } from "../errors";
import { DelegateRegistrationTransactionHandler } from "./delegate-registration";
import { DelegateResignationTransactionHandler } from "./delegate-resignation";
import { HtlcClaimTransactionHandler } from "./htlc-claim";
import { HtlcLockTransactionHandler } from "./htlc-lock";
import { HtlcRefundTransactionHandler } from "./htlc-refund";
import { IpfsTransactionHandler } from "./ipfs";
import { MultiPaymentTransactionHandler } from "./multi-payment";
import { MultiSignatureTransactionHandler } from "./multi-signature";
import { SecondSignatureTransactionHandler } from "./second-signature";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";
import { TransferTransactionHandler } from "./transfer";
import { VoteTransactionHandler } from "./vote";

export class TransactionHandlerRegistry {
    private readonly registeredTransactionHandlers: Map<
        Transactions.InternalTransactionType,
        TransactionHandler
    > = new Map();

    private readonly knownWalletAttributes: Map<string, boolean> = new Map();

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

    public getAll(): TransactionHandler[] {
        return [...this.registeredTransactionHandlers.values()];
    }

    public async get(type: number, typeGroup?: number): Promise<TransactionHandler> {
        const internalType: Transactions.InternalTransactionType = Transactions.InternalTransactionType.from(
            type,
            typeGroup,
        );
        if (this.registeredTransactionHandlers.has(internalType)) {
            const handler: TransactionHandler = this.registeredTransactionHandlers.get(internalType);
            if (!(await handler.isActivated())) {
                throw new DeactivatedTransactionHandlerError(internalType);
            }
            return handler;
        }

        throw new InvalidTransactionTypeError(internalType.toString());
    }

    public async getActivatedTransactionHandlers(): Promise<TransactionHandler[]> {
        const activatedTransactionHandlers: TransactionHandler[] = [];

        for (const handler of this.registeredTransactionHandlers.values()) {
            if (await handler.isActivated()) {
                activatedTransactionHandlers.push(handler);
            }
        }

        return activatedTransactionHandlers;
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

        if (typeGroup !== Enums.TransactionTypeGroup.Core) {
            Transactions.TransactionRegistry.registerTransactionType(transactionConstructor);
        }

        const walletAttributes: ReadonlyArray<string> = service.walletAttributes();
        for (const attribute of walletAttributes) {
            assert(!this.knownWalletAttributes.has(attribute), `Wallet attribute is already known: ${attribute}`);
            this.knownWalletAttributes.set(attribute, true);
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

        const walletAttributes: ReadonlyArray<string> = service.walletAttributes();
        for (const attribute of walletAttributes) {
            this.knownWalletAttributes.delete(attribute);
        }

        Transactions.TransactionRegistry.deregisterTransactionType(transactionConstructor);
        this.registeredTransactionHandlers.delete(internalType);
    }

    public isKnownWalletAttribute(attribute: string): boolean {
        return this.knownWalletAttributes.has(attribute);
    }
}

export const transactionHandlerRegistry = new TransactionHandlerRegistry();
