import { Container, Contracts, Utils as KernelUtils } from "@arkecosystem/core-kernel";
import {
    Enums,
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces as CryptoInterfaces, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { EntityWrongSubTypeError, StaticFeeMismatchError } from "../errors";
import { EntityRegisterSubHandler, EntityResignSubHandler, EntityUpdateSubHandler } from "./entity-subhandlers";
import BridgechainSubHandlers from "./entity-subhandlers/bridgechain";
import BusinessSubHandlers from "./entity-subhandlers/business";
import DeveloperSubHandlers from "./entity-subhandlers/developer";
import PluginCoreSubHandlers from "./entity-subhandlers/plugin-core";
import PluginDesktopSubHandlers from "./entity-subhandlers/plugin-desktop";

type SubHandlers = {
    [Enums.EntityAction.Register]: EntityRegisterSubHandler;
    [Enums.EntityAction.Resign]: EntityResignSubHandler;
    [Enums.EntityAction.Update]: EntityUpdateSubHandler;
};
type Handlers = {
    [Enums.EntityType.Business]: {
        [Enums.EntitySubType.None]: SubHandlers;
    };
    [Enums.EntityType.Bridgechain]: {
        [Enums.EntitySubType.None]: SubHandlers;
    };
    [Enums.EntityType.Developer]: {
        [Enums.EntitySubType.None]: SubHandlers;
    };
    [Enums.EntityType.Plugin]: {
        [Enums.EntitySubType.PluginCore]: SubHandlers;
        [Enums.EntitySubType.PluginDesktop]: SubHandlers;
    };
};

@Container.injectable()
export class EntityTransactionHandler extends Handlers.TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    protected readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    private handlers!: Handlers;

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.EntityTransaction;
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip36 === true;
    }

    public dynamicFee({ height }: Contracts.Shared.DynamicFeeContext): Utils.BigNumber {
        return this.getConstructor().staticFee({ height });
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["entities"];
    }

    public async bootstrap(): Promise<void> {
        if (!this.handlers) {
            this.initializeHandlers();
        }

        for (const entityTypeStr of Object.keys(this.handlers)) { // entityTypeStr is a string because used as object key
            for (const entitySubTypeStr of Object.keys(this.handlers[entityTypeStr])) { // entitySubTypeStr is a string because object key
                const entityActions = [
                    Enums.EntityAction.Register,
                    Enums.EntityAction.Update,
                    Enums.EntityAction.Resign,
                ];

                for (const entityAction of entityActions) {
                    const criteria = {
                        typeGroup: this.getConstructor().typeGroup,
                        type: this.getConstructor().type,
                        asset: {
                            type: Number(entityTypeStr), // entity type is integer in database
                            subType: Number(entitySubTypeStr), // entity subType is integer in database
                            action: entityAction
                        },
                    };

                    const handler = this.handlers[entityTypeStr][entitySubTypeStr][entityAction] as
                        | EntityRegisterSubHandler
                        | EntityUpdateSubHandler
                        | EntityResignSubHandler;

                    await handler.bootstrap(this.walletRepository, this.transactionHistoryService, criteria);
                }
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: CryptoInterfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        if (Utils.isException(transaction.data)) {
            return;
        }

        const staticFee: Utils.BigNumber = this.getConstructor().staticFee();
        if (!transaction.data.fee.isEqualTo(staticFee)) {
            throw new StaticFeeMismatchError(staticFee.toFixed());
        }

        super.throwIfCannotBeApplied(transaction, wallet);

        const handler = this.getHandler(transaction);
        if (!handler) {
            throw new EntityWrongSubTypeError(); // wrong sub type / type association
        }

        return this.getHandler(transaction)!.throwIfCannotBeApplied(transaction, wallet, this.walletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        return this.getHandler(transaction)!.emitEvents(transaction, emitter);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        return this.getHandler(transaction)!.applyToSender(transaction, this.walletRepository);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        return this.getHandler(transaction)!.revertForSender(
            transaction,
            this.walletRepository,
            this.transactionHistoryService,
        );
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}

    private getHandler(
        transaction: Interfaces.ITransaction,
    ): EntityRegisterSubHandler | EntityResignSubHandler | EntityUpdateSubHandler | undefined {
        if (!this.handlers) {
            this.initializeHandlers();
        }

        KernelUtils.assert.defined<MagistrateInterfaces.IEntityAsset>(transaction.data.asset);

        const {
            type,
            subType,
            action,
        }: {
            type: Enums.EntityType;
            subType: Enums.EntitySubType;
            action: Enums.EntityAction;
        } = transaction.data.asset;

        return this.handlers[type]?.[subType]?.[action];
    }

    private initializeHandlers(): void {
        this.handlers = {
            [Enums.EntityType.Business]: {
                [Enums.EntitySubType.None]: {
                    [Enums.EntityAction.Register]: this.app.resolve(BusinessSubHandlers.BusinessRegisterSubHandler),
                    [Enums.EntityAction.Update]: this.app.resolve(BusinessSubHandlers.BusinessUpdateSubHandler),
                    [Enums.EntityAction.Resign]: this.app.resolve(BusinessSubHandlers.BusinessResignSubHandler),
                },
            },
            [Enums.EntityType.Bridgechain]: {
                [Enums.EntitySubType.None]: {
                    [Enums.EntityAction.Register]: this.app.resolve(
                        BridgechainSubHandlers.BridgechainRegisterSubHandler,
                    ),
                    [Enums.EntityAction.Update]: this.app.resolve(BridgechainSubHandlers.BridgechainUpdateSubHandler),
                    [Enums.EntityAction.Resign]: this.app.resolve(BridgechainSubHandlers.BridgechainResignSubHandler),
                },
            },
            [Enums.EntityType.Developer]: {
                [Enums.EntitySubType.None]: {
                    [Enums.EntityAction.Register]: this.app.resolve(DeveloperSubHandlers.DeveloperRegisterSubHandler),
                    [Enums.EntityAction.Update]: this.app.resolve(DeveloperSubHandlers.DeveloperUpdateSubHandler),
                    [Enums.EntityAction.Resign]: this.app.resolve(DeveloperSubHandlers.DeveloperResignSubHandler),
                },
            },
            [Enums.EntityType.Plugin]: {
                [Enums.EntitySubType.PluginCore]: {
                    [Enums.EntityAction.Register]: this.app.resolve(PluginCoreSubHandlers.PluginCoreRegisterSubHandler),
                    [Enums.EntityAction.Update]: this.app.resolve(PluginCoreSubHandlers.PluginCoreUpdateSubHandler),
                    [Enums.EntityAction.Resign]: this.app.resolve(PluginCoreSubHandlers.PluginCoreResignSubHandler),
                },
                [Enums.EntitySubType.PluginDesktop]: {
                    [Enums.EntityAction.Register]: this.app.resolve(
                        PluginDesktopSubHandlers.PluginDesktopRegisterSubHandler,
                    ),
                    [Enums.EntityAction.Update]: this.app.resolve(
                        PluginDesktopSubHandlers.PluginDesktopUpdateSubHandler,
                    ),
                    [Enums.EntityAction.Resign]: this.app.resolve(
                        PluginDesktopSubHandlers.PluginDesktopResignSubHandler,
                    ),
                },
            },
        };
    }
}
