import { app, Container, Services } from "@arkecosystem/core-kernel";
import { Enums, Errors, Transactions } from "@arkecosystem/crypto";

import { InvalidTransactionTypeError, DeactivatedTransactionHandlerError } from "../errors";
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

// todo: review the implementation
@Container.injectable()
export class TransactionHandlerRegistry {
    private readonly registeredTransactionHandlers: Map<
        Transactions.InternalTransactionType,
        TransactionHandler
    > = new Map();

    private readonly attributes: Services.Attributes.AttributeIndex = app
        .get<Services.Attributes.AttributeService>(Container.Identifiers.AttributeService)
        .get("wallet");

    public constructor() {
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

        for (const attribute of service.walletAttributes()) {
            this.attributes.bind(attribute);
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

        for (const attribute of service.walletAttributes()) {
            this.attributes.unbind(attribute);
        }

        Transactions.TransactionRegistry.deregisterTransactionType(transactionConstructor);
        this.registeredTransactionHandlers.delete(internalType);
    }
}
