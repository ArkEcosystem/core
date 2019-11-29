import { Container, Contracts, Services, Utils } from "@arkecosystem/core-kernel";
import { Enums, Transactions } from "@arkecosystem/crypto";

import { DeactivatedTransactionHandlerError, InvalidTransactionTypeError } from "../errors";
import { One, Two } from ".";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

// todo: review the implementation
@Container.injectable()
export class TransactionHandlerRegistry {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Server
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    private readonly registeredTransactionHandlers: Map<
        Transactions.InternalTransactionType,
        Map<number, TransactionHandler>
    > = new Map();

    public initialize(): void {
        this.registerTransactionHandler(One.TransferTransactionHandler);
        this.registerTransactionHandler(Two.TransferTransactionHandler);

        this.registerTransactionHandler(One.SecondSignatureRegistrationTransactionHandler);
        this.registerTransactionHandler(Two.SecondSignatureRegistrationTransactionHandler);

        this.registerTransactionHandler(One.DelegateRegistrationTransactionHandler);
        this.registerTransactionHandler(Two.DelegateRegistrationTransactionHandler);

        this.registerTransactionHandler(One.VoteTransactionHandler);
        this.registerTransactionHandler(Two.VoteTransactionHandler);

        this.registerTransactionHandler(One.MultiSignatureRegistrationTransactionHandler);
        this.registerTransactionHandler(Two.MultiSignatureRegistrationTransactionHandler);

        this.registerTransactionHandler(Two.IpfsTransactionHandler);

        this.registerTransactionHandler(Two.MultiPaymentTransactionHandler);

        this.registerTransactionHandler(Two.DelegateResignationTransactionHandler);

        this.registerTransactionHandler(Two.HtlcLockTransactionHandler);
        this.registerTransactionHandler(Two.HtlcClaimTransactionHandler);
        this.registerTransactionHandler(Two.HtlcRefundTransactionHandler);
    }

    public getAll(): Map<number, TransactionHandler>[] {
        return [...this.registeredTransactionHandlers.values()];
    }

    public async get({
        type,
        typeGroup,
        version,
    }: {
        type: number;
        typeGroup?: number;
        version?: number;
    }): Promise<TransactionHandler> {
        const internalType: Transactions.InternalTransactionType = Transactions.InternalTransactionType.from(
            type,
            typeGroup,
        );
        version = version ?? 1;

        Utils.assert.defined<Transactions.InternalTransactionType>(internalType);

        if (!this.registeredTransactionHandlers.has(internalType)) {
            throw new InvalidTransactionTypeError(internalType.toString());
        }

        const handler: Map<number, TransactionHandler> | undefined = this.registeredTransactionHandlers.get(
            internalType,
        );

        Utils.assert.defined<Map<number, TransactionHandler>>(handler);

        if (!handler.has(version)) {
            throw new InvalidTransactionTypeError(internalType.toString());
        }

        const handlerVersion: TransactionHandler = handler.get(version)!;

        if (!(await handlerVersion.isActivated())) {
            throw new DeactivatedTransactionHandlerError(internalType);
        }

        return handlerVersion;
    }

    public async getActivatedTransactionHandlers(): Promise<TransactionHandler[]> {
        const activatedTransactionHandlers: TransactionHandler[] = [];

        for (const handlers of this.registeredTransactionHandlers.values()) {
            for (const version of handlers.values()) {
                if (await version.isActivated()) {
                    activatedTransactionHandlers.push(version);
                }
            }
        }

        return activatedTransactionHandlers;
    }

    public registerTransactionHandler(constructor: TransactionHandlerConstructor) {
        const handler: TransactionHandler = this.app.resolve(constructor);
        const transactionConstructor = handler.getConstructor();

        Utils.assert.defined<number>(transactionConstructor.type);
        Utils.assert.defined<number>(transactionConstructor.typeGroup);

        for (const dependency of handler.dependencies()) {
            this.registerTransactionHandler(dependency);
        }

        const internalType: Transactions.InternalTransactionType = Transactions.InternalTransactionType.from(
            transactionConstructor.type,
            transactionConstructor.typeGroup,
        );

        if (this.registeredTransactionHandlers.get(internalType)?.has(transactionConstructor.version)) {
            return;
        }

        if (transactionConstructor.typeGroup !== Enums.TransactionTypeGroup.Core) {
            Transactions.TransactionRegistry.registerTransactionType(transactionConstructor);
        }

        for (const attribute of handler.walletAttributes()) {
            // TODO: scope attribute by `handler.getConstructor().key` to distinguish between duplicate attributes ?
            if (
                !this.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).has(attribute)
            ) {
                this.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set(attribute);
            }
        }

        if (!this.registeredTransactionHandlers.has(internalType)) {
            this.registeredTransactionHandlers.set(internalType, new Map());
        }

        this.registeredTransactionHandlers.get(internalType)?.set(transactionConstructor.version, handler);
    }

    public deregisterTransactionHandler(constructor: TransactionHandlerConstructor): void {
        const service: TransactionHandler = new constructor();
        const transactionConstructor = service.getConstructor();

        Utils.assert.defined<number>(transactionConstructor.type);
        Utils.assert.defined<number>(transactionConstructor.typeGroup);

        const internalType:
            | Transactions.InternalTransactionType
            | undefined = Transactions.InternalTransactionType.from(
            transactionConstructor.type,
            transactionConstructor.typeGroup,
        );

        Utils.assert.defined<Transactions.InternalTransactionType>(internalType);

        if (
            !this.registeredTransactionHandlers.has(internalType) &&
            !this.registeredTransactionHandlers.get(internalType)!.has(transactionConstructor.version)
        ) {
            throw new InvalidTransactionTypeError(internalType.toString());
        }

        for (const attribute of service.walletAttributes()) {
            this.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).forget(attribute);
        }

        Transactions.TransactionRegistry.deregisterTransactionType(transactionConstructor);

        this.registeredTransactionHandlers.get(internalType)!.delete(transactionConstructor.version);

        if (this.registeredTransactionHandlers.get(internalType)!.size === 0) {
            this.registeredTransactionHandlers.delete(internalType);
        }
    }
}
