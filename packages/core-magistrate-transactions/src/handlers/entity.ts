import { app } from "@arkecosystem/core-container";
import { Enums, Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import {
    Handlers as IHandlers,
    Interfaces as TransactionInterfaces,
    TransactionReader,
} from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    EntityAlreadyRegisteredError,
    EntityAlreadyResignedError,
    EntityNameAlreadyRegisteredError,
    EntityNameDoesNotMatchDelegateError,
    EntityNotRegisteredError,
    EntitySenderIsNotDelegateError,
    EntityWrongSubTypeError,
    EntityWrongTypeError,
    StaticFeeMismatchError,
} from "../errors";
import { IEntitiesWallet, IEntityWallet } from "../interfaces";
import { MagistrateIndex } from "../wallet-manager";

export class EntityTransactionHandler extends IHandlers.TransactionHandler {
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
        return this.getConstructor().staticFee({ data: context.transaction.data });
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["entities"];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);

                this.applyTransactionToWallet(transaction, wallet);

                walletManager.index([wallet]);
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        if (Utils.isException(transaction)) {
            return;
        }

        const staticFee: Utils.BigNumber = this.getConstructor().staticFee({ data: transaction.data });
        if (!transaction.data.fee.isEqualTo(staticFee)) {
            throw new StaticFeeMismatchError(staticFee.toFixed());
        }

        super.throwIfCannotBeApplied(transaction, wallet, walletManager);

        const walletEntities = wallet.getAttribute("entities", {});
        if (transaction.data.asset.action === Enums.EntityAction.Register) {
            if (walletEntities[transaction.id]) {
                throw new EntityAlreadyRegisteredError();
            }

            for (const wallet of walletManager.getIndex(MagistrateIndex.Entities).values()) {
                if (wallet.hasAttribute("entities")) {
                    const entityValues: IEntityWallet[] = Object.values(wallet.getAttribute("entities"));

                    if (
                        entityValues.some(
                            entity =>
                                entity.data.name!.toLowerCase() === transaction.data.asset!.data.name.toLowerCase() &&
                                entity.type === transaction.data.asset!.type,
                        )
                    ) {
                        throw new EntityNameAlreadyRegisteredError();
                    }
                }
            }

            // specific check for Delegate entity to ensure that the sender delegate username matches the entity name
            if (transaction.data.asset.type === Enums.EntityType.Delegate) {
                if (!wallet.hasAttribute("delegate.username")) {
                    throw new EntitySenderIsNotDelegateError();
                }
                if (wallet.getAttribute("delegate.username") !== transaction.data.asset.data.name) {
                    throw new EntityNameDoesNotMatchDelegateError();
                }
            }
        } else {
            // Resign or update share the same checks
            if (!walletEntities[transaction.data.asset.registrationId]) {
                throw new EntityNotRegisteredError();
            }
            if (walletEntities[transaction.data.asset.registrationId].resigned) {
                throw new EntityAlreadyResignedError();
            }
            if (walletEntities[transaction.data.asset.registrationId].type !== transaction.data.asset.type) {
                throw new EntityWrongTypeError();
            }
            if (walletEntities[transaction.data.asset.registrationId].subType !== transaction.data.asset.subType) {
                throw new EntityWrongSubTypeError();
            }
        }
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string; message: string } | null> {
        return null;
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        return;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const wallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        this.applyTransactionToWallet(transaction.data, wallet);

        walletManager.index([wallet]);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});

        switch (transaction.data.asset.action) {
            case Enums.EntityAction.Register:
                delete entities[transaction.id];
                break;
            case Enums.EntityAction.Update:
                return this.revertForSenderUpdate(transaction, walletManager);
            case Enums.EntityAction.Resign:
                delete entities[transaction.data.asset.registrationId].resigned;
                break;
        }

        wallet.setAttribute("entities", entities);
        walletManager.index([wallet]);
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

    private async revertForSenderUpdate(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const connection: Database.IConnection = app.resolvePlugin<Database.IDatabaseService>("database").connection;

        // Here we have to "replay" entity registration and update transactions associated with the registration id
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        const entities = sender.getAttribute("entities", {});
        const registrationId: string = transaction.data.asset.registrationId;

        const dbEntityTransactions = await connection.transactionsRepository.search({
            parameters: [
                {
                    field: "senderPublicKey",
                    value: transaction.data.senderPublicKey,
                    operator: Database.SearchOperator.OP_EQ,
                },
                {
                    field: "type",
                    value: Enums.MagistrateTransactionType.Entity,
                    operator: Database.SearchOperator.OP_EQ,
                },
                {
                    field: "typeGroup",
                    value: transaction.data.typeGroup,
                    operator: Database.SearchOperator.OP_EQ,
                },
            ],
            orderBy: [
                {
                    direction: "asc",
                    field: "nonce",
                },
            ],
        });

        let mergedEntity: IEntityWallet;
        for (const dbEntityTx of dbEntityTransactions.rows) {
            if (dbEntityTx.id === transaction.id) {
                continue;
            }

            if (!mergedEntity) {
                // first register tx
                mergedEntity = {
                    type: dbEntityTx.asset.type,
                    subType: dbEntityTx.asset.subType,
                    data: { ...dbEntityTx.asset.data },
                };
            } else {
                mergedEntity.data = { ...mergedEntity.data, ...dbEntityTx.asset!.data };
            }
        }

        entities[registrationId] = {
            type: mergedEntity.type,
            subType: mergedEntity.subType,
            data: { ...mergedEntity.data },
        };

        sender.setAttribute("entities", entities);

        walletManager.index([sender]);
    }

    private applyTransactionToWallet(
        transaction: Database.IBootstrapTransaction | Interfaces.ITransactionData,
        wallet: State.IWallet,
    ) {
        const entities: IEntitiesWallet = wallet.getAttribute<IEntitiesWallet>("entities", {});

        switch (transaction.asset.action) {
            case Enums.EntityAction.Register:
                entities[transaction.id] = {
                    type: transaction.asset.type,
                    subType: transaction.asset.subType,
                    data: transaction.asset.data,
                };
                break;
            case Enums.EntityAction.Update:
                entities[transaction.asset.registrationId] = {
                    type: entities[transaction.asset.registrationId].type,
                    subType: entities[transaction.asset.registrationId].subType,
                    data: { ...entities[transaction.asset.registrationId].data, ...transaction.asset.data },
                };
                break;
            case Enums.EntityAction.Resign:
                entities[transaction.asset.registrationId] = {
                    ...entities[transaction.asset.registrationId],
                    resigned: true,
                };
                break;
        }

        wallet.setAttribute("entities", entities);
    }
}
