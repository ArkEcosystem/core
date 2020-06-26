import { Interfaces } from "@arkecosystem/crypto";

import { Database, EventEmitter, State } from "@arkecosystem/core-interfaces";
import {
    EntityAlreadyResignedError,
    EntityNotRegisteredError,
    EntityWrongSubTypeError,
    EntityWrongTypeError,
} from "../../errors";
import { IEntitiesWallet } from "../../interfaces";

// Entity Resign sub-handler : most of the sub-handler methods are implemented here
// but it is extended by the bridgechain, business, developer, plugin... subhandlers
export class EntityResignSubHandler {
    public async bootstrap(
        transactions: Database.IBootstrapTransaction[],
        walletManager: State.IWalletManager,
    ): Promise<void> {
        for (const transaction of transactions) {
            const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const entities: IEntitiesWallet = wallet.getAttribute<IEntitiesWallet>("entities");

            entities[transaction.asset.registrationId] = {
                ...entities[transaction.asset.registrationId],
                resigned: true,
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
        const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});
        if (entities[transaction.data.asset.registrationId]) {
            entities[transaction.data.asset.registrationId] = {
                ...entities[transaction.data.asset.registrationId],
                resigned: true,
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
        const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});
        if (entities[transaction.data.asset.registrationId]) {
            delete entities[transaction.data.asset.registrationId].resigned;
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
}
