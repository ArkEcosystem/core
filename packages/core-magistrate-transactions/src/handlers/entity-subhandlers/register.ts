import { Interfaces } from "@arkecosystem/crypto";

import { Database, EventEmitter, State } from "@arkecosystem/core-interfaces";
import { EntityAlreadyRegisteredError, EntityNameAlreadyRegisteredError } from "../../errors";
import { IEntitiesWallet, IEntityWallet } from "../../interfaces";
import { MagistrateIndex } from "../../wallet-manager";

// Entity Register sub-handler : most of the sub-handler methods are implemented here
// but it is extended by the bridgechain, business, developer, plugin... subhandlers
export class EntityRegisterSubHandler {
    public async bootstrap(
        transactions: Database.IBootstrapTransaction[],
        walletManager: State.IWalletManager,
    ): Promise<void> {
        for (const transaction of transactions) {
            const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const entities: IEntitiesWallet = wallet.getAttribute<IEntitiesWallet>("entities", {});

            entities[transaction.id] = {
                type: transaction.asset.type,
                subType: transaction.asset.subType,
                data: transaction.asset.data,
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
                            entity.type === transaction.data.asset!.type &&
                            entity.subType === transaction.data.asset!.subType,
                    )
                ) {
                    throw new EntityNameAlreadyRegisteredError();
                }
            }
        }
    }

    // tslint:disable-next-line:no-empty
    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {}

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});
        entities[transaction.id] = {
            type: transaction.data.asset.type,
            subType: transaction.data.asset.subType,
            data: { ...transaction.data.asset.data },
        };

        wallet.setAttribute("entities", entities);

        walletManager.index([wallet]);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        connection: Database.IConnection,
    ): Promise<void> {
        const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});
        delete entities[transaction.id];

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
}
