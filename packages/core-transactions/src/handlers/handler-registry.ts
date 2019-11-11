import { Container, Contracts, Services, Utils } from "@arkecosystem/core-kernel";
import { Enums, Errors, Transactions } from "@arkecosystem/crypto";

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

// todo: review the implementation
@Container.injectable()
export class TransactionHandlerRegistry {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Server
     */
    // @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    private readonly registeredTransactionHandlers: Map<
        Transactions.InternalTransactionType,
        TransactionHandler
    > = new Map();

    // todo: we should avoid the use of constructors for initialisation as inversify uses it for injection
    public constructor(@Container.inject(Container.Identifiers.Application) app: Contracts.Kernel.Application) {
        this.app = app;

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
        const internalType:
            | Transactions.InternalTransactionType
            | undefined = Transactions.InternalTransactionType.from(type, typeGroup);

        Utils.assert.defined<Transactions.InternalTransactionType>(internalType);

        if (this.registeredTransactionHandlers.has(internalType)) {
            const handler: TransactionHandler | undefined = this.registeredTransactionHandlers.get(internalType);

            Utils.assert.defined<TransactionHandler>(handler);

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
        const service: TransactionHandler = this.app.resolve(constructor);
        const transactionConstructor = service.getConstructor();

        Utils.assert.defined<number>(transactionConstructor.type);
        Utils.assert.defined<number>(transactionConstructor.typeGroup);

        for (const dependency of service.dependencies()) {
            this.registerTransactionHandler(dependency);
        }

        const internalType:
            | Transactions.InternalTransactionType
            | undefined = Transactions.InternalTransactionType.from(
            transactionConstructor.type,
            transactionConstructor.typeGroup,
        );

        Utils.assert.defined<number>(internalType);

        if (this.registeredTransactionHandlers.has(internalType)) {
            return;
        }

        if (transactionConstructor.typeGroup !== Enums.TransactionTypeGroup.Core) {
            Transactions.TransactionRegistry.registerTransactionType(transactionConstructor);
        }

        for (const attribute of service.walletAttributes()) {
            this.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set(attribute);
        }

        this.registeredTransactionHandlers.set(internalType, service);
    }

    public deregisterTransactionHandler(constructor: TransactionHandlerConstructor): void {
        const service: TransactionHandler = new constructor();
        const transactionConstructor = service.getConstructor();

        Utils.assert.defined<number>(transactionConstructor.type);
        Utils.assert.defined<number>(transactionConstructor.typeGroup);

        if (
            transactionConstructor.typeGroup === Enums.TransactionTypeGroup.Core ||
            transactionConstructor.typeGroup === undefined
        ) {
            throw new Errors.CoreTransactionTypeGroupImmutableError();
        }

        const internalType:
            | Transactions.InternalTransactionType
            | undefined = Transactions.InternalTransactionType.from(
            transactionConstructor.type,
            transactionConstructor.typeGroup,
        );

        Utils.assert.defined<Transactions.InternalTransactionType>(internalType);

        if (!this.registeredTransactionHandlers.has(internalType)) {
            throw new InvalidTransactionTypeError(internalType.toString());
        }

        for (const attribute of service.walletAttributes()) {
            this.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).forget(attribute);
        }

        Transactions.TransactionRegistry.deregisterTransactionType(transactionConstructor);
        this.registeredTransactionHandlers.delete(internalType);
    }
}
