import { Enums, Interfaces as MagistrateInterfaces } from "@arkecosystem/core-magistrate-crypto";
import { Interfaces } from "@arkecosystem/crypto";

import { Database, EventEmitter, State } from "@arkecosystem/core-interfaces";
import {
    EntityAlreadyResignedError,
    EntityNotRegisteredError,
    EntityWrongSubTypeError,
    EntityWrongTypeError,
} from "../../errors";
import { IEntitiesWallet, IEntityWallet } from "../../interfaces";

// Entity Register sub-handler : most of the sub-handler methods are implemented here
// but it is extended by the bridgechain, business, developer, plugin... subhandlers
export class EntityUpdateSubHandler {
    public async bootstrap(
        transactions: Database.IBootstrapTransaction[],
        walletManager: State.IWalletManager,
    ): Promise<void> {
        for (const transaction of transactions) {
            const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const entities: IEntitiesWallet = wallet.getAttribute<IEntitiesWallet>("entities");

            entities[transaction.asset.registrationId] = {
                type: entities[transaction.asset.registrationId].type,
                subType: entities[transaction.asset.registrationId].subType,
                data: this.mergeAssetData(entities[transaction.asset.registrationId].data, transaction.asset.data),
            };

            wallet.setAttribute("entities", entities);

            walletManager.index([wallet]);
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const walletEntities = wallet.getAttribute("entities", {});
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

    // tslint:disable-next-line:no-empty
    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {}

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const assetData: MagistrateInterfaces.IEntityAssetData = transaction.data.asset.data;

        const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});
        if (entities[transaction.data.asset.registrationId]) {
            entities[transaction.data.asset.registrationId] = {
                ...entities[transaction.data.asset.registrationId],
                data: this.mergeAssetData(entities[transaction.data.asset.registrationId].data, assetData),
            };
        }

        wallet.setAttribute("entities", entities);

        walletManager.index([wallet]);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        connection: Database.IConnection,
    ): Promise<void> {
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
                mergedEntity.data = this.mergeAssetData(mergedEntity.data, dbEntityTx.asset!.data);
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

    private mergeAssetData(
        baseData: MagistrateInterfaces.IEntityAssetData,
        dataToMerge: MagistrateInterfaces.IEntityAssetData,
    ): MagistrateInterfaces.IEntityAssetData {
        return {
            ...baseData,
            ...dataToMerge,
        };
    }
}
