import { app } from "@arkecosystem/core-container";
import {
    Enums,
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import {
    Handlers as IHandlers,
    Interfaces as TransactionInterfaces,
    TransactionReader,
} from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { EntityWrongSubTypeError, StaticFeeMismatchError } from "../errors";
import { EntityRegisterSubHandler, EntityResignSubHandler, EntityUpdateSubHandler } from "./entity-subhandlers";
import { BridgechainSubHandlers } from "./entity-subhandlers/bridgechain";
import { BusinessSubHandlers } from "./entity-subhandlers/business";
import { DeveloperSubHandlers } from "./entity-subhandlers/developer";
import { PluginCoreSubHandlers } from "./entity-subhandlers/plugin-core";
import { PluginDesktopSubHandlers } from "./entity-subhandlers/plugin-desktop";

interface ISubHandlers {
    [Enums.EntityAction.Register]: EntityRegisterSubHandler;
    [Enums.EntityAction.Resign]: EntityResignSubHandler;
    [Enums.EntityAction.Update]: EntityUpdateSubHandler;
}
interface IHandlers {
    [Enums.EntityType.Business]: {
        [Enums.EntitySubType.None]: ISubHandlers;
    };
    [Enums.EntityType.Bridgechain]: {
        [Enums.EntitySubType.None]: ISubHandlers;
    };
    [Enums.EntityType.Developer]: {
        [Enums.EntitySubType.None]: ISubHandlers;
    };
    [Enums.EntityType.Plugin]: {
        [Enums.EntitySubType.PluginCore]: ISubHandlers;
        [Enums.EntitySubType.PluginDesktop]: ISubHandlers;
    };
}

export class EntityTransactionHandler extends IHandlers.TransactionHandler {
    private handlers!: IHandlers;

    public dependencies(): ReadonlyArray<IHandlers.TransactionHandlerConstructor> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.EntityTransaction;
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip36 === true;
    }

    public dynamicFee(context: TransactionInterfaces.IDynamicFeeContext): Utils.BigNumber {
        return this.getConstructor().staticFee(context);
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["entities"];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        const registerTransactions = [];
        const updateTransactions = [];
        const resignTransactions = [];
        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                switch (transaction.asset.action) {
                    case Enums.EntityAction.Register:
                        registerTransactions.push(transaction);
                        break;
                    case Enums.EntityAction.Update:
                        updateTransactions.push(transaction);
                        break;
                    case Enums.EntityAction.Resign:
                        resignTransactions.push(transaction);
                        break;
                }
            }
        }

        const registerSubHandler = new EntityRegisterSubHandler();
        await registerSubHandler.bootstrap(registerTransactions, walletManager);

        const updateSubHandler = new EntityUpdateSubHandler();
        await updateSubHandler.bootstrap(updateTransactions, walletManager);

        const resignSubHandler = new EntityResignSubHandler();
        await resignSubHandler.bootstrap(resignTransactions, walletManager);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        if (Utils.isException(transaction)) {
            return;
        }

        const staticFee: Utils.BigNumber = this.getConstructor().staticFee();
        if (!transaction.data.fee.isEqualTo(staticFee)) {
            throw new StaticFeeMismatchError(staticFee.toFixed());
        }

        super.throwIfCannotBeApplied(transaction, wallet, walletManager);

        const handler = this.getHandler(transaction);
        if (!handler) {
            throw new EntityWrongSubTypeError(); // wrong sub type / type association
        }

        return this.getHandler(transaction)!.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string; message: string } | null> {
        return null;
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        return this.getHandler(transaction)!.emitEvents(transaction, emitter);
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        return this.getHandler(transaction)!.applyToSender(transaction, walletManager);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const connection: Database.IConnection = app.resolvePlugin<Database.IDatabaseService>("database").connection;

        await super.revertForSender(transaction, walletManager);

        return this.getHandler(transaction)!.revertForSender(transaction, walletManager, connection);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}

    private getHandler(
        transaction: Interfaces.ITransaction,
    ): EntityRegisterSubHandler | EntityResignSubHandler | EntityUpdateSubHandler | undefined {
        if (!this.handlers) {
            this.initializeHandlers();
        }

        const {
            type,
            subType,
            action,
        }: {
            type: Enums.EntityType;
            subType: Enums.EntitySubType;
            action: Enums.EntityAction;
        } = transaction.data.asset as MagistrateInterfaces.IEntityAsset;

        if (this.handlers[type] && this.handlers[type][subType] && this.handlers[type][subType][action]) {
            return this.handlers[type][subType][action];
        }
        return undefined;
    }

    private initializeHandlers(): void {
        this.handlers = {
            [Enums.EntityType.Business]: {
                [Enums.EntitySubType.None]: {
                    [Enums.EntityAction.Register]: new BusinessSubHandlers.BusinessRegisterSubHandler(),
                    [Enums.EntityAction.Resign]: new BusinessSubHandlers.BusinessResignSubHandler(),
                    [Enums.EntityAction.Update]: new BusinessSubHandlers.BusinessUpdateSubHandler(),
                },
            },
            [Enums.EntityType.Bridgechain]: {
                [Enums.EntitySubType.None]: {
                    [Enums.EntityAction.Register]: new BridgechainSubHandlers.BridgechainRegisterSubHandler(),
                    [Enums.EntityAction.Resign]: new BridgechainSubHandlers.BridgechainResignSubHandler(),
                    [Enums.EntityAction.Update]: new BridgechainSubHandlers.BridgechainUpdateSubHandler(),
                },
            },
            [Enums.EntityType.Developer]: {
                [Enums.EntitySubType.None]: {
                    [Enums.EntityAction.Register]: new DeveloperSubHandlers.DeveloperRegisterSubHandler(),
                    [Enums.EntityAction.Resign]: new DeveloperSubHandlers.DeveloperResignSubHandler(),
                    [Enums.EntityAction.Update]: new DeveloperSubHandlers.DeveloperUpdateSubHandler(),
                },
            },
            [Enums.EntityType.Plugin]: {
                [Enums.EntitySubType.PluginCore]: {
                    [Enums.EntityAction.Register]: new PluginCoreSubHandlers.PluginCoreRegisterSubHandler(),
                    [Enums.EntityAction.Resign]: new PluginCoreSubHandlers.PluginCoreResignSubHandler(),
                    [Enums.EntityAction.Update]: new PluginCoreSubHandlers.PluginCoreUpdateSubHandler(),
                },
                [Enums.EntitySubType.PluginDesktop]: {
                    [Enums.EntityAction.Register]: new PluginDesktopSubHandlers.PluginDesktopRegisterSubHandler(),
                    [Enums.EntityAction.Resign]: new PluginDesktopSubHandlers.PluginDesktopResignSubHandler(),
                    [Enums.EntityAction.Update]: new PluginDesktopSubHandlers.PluginDesktopUpdateSubHandler(),
                },
            },
        };
    }
}
