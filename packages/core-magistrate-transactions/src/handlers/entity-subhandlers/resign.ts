import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces } from "@arkecosystem/crypto";

import {
    EntityAlreadyResignedError,
    EntityNotRegisteredError,
    EntityWrongSubTypeError,
    EntityWrongTypeError,
} from "../../errors";
import { IEntitiesWallet } from "../../interfaces";

// Entity Resign sub-handler : most of the sub-handler methods are implemented here
// but it is extended by the bridgechain, business, developer, plugin... subhandlers
@Container.injectable()
export class EntityResignSubHandler {
    public async bootstrap(
        walletRepository: Contracts.State.WalletRepository,
        reader: TransactionReader,
    ): Promise<void> {
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.senderPublicKey);
            const entities: IEntitiesWallet = wallet.getAttribute<IEntitiesWallet>("entities");

            entities[transaction.asset.registrationId] = {
                ...entities[transaction.asset.registrationId],
                resigned: true,
            };

            wallet.setAttribute("entities", entities);

            walletRepository.index(wallet);
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        Utils.assert.defined<string>(transaction.data.asset?.registrationId);

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

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {}

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);
        Utils.assert.defined<string>(transaction.id);
        Utils.assert.defined<string>(transaction.data.asset?.registrationId);

        const wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});
        if (entities[transaction.data.asset.registrationId]) {
            entities[transaction.data.asset.registrationId] = {
                ...entities[transaction.data.asset.registrationId],
                resigned: true,
            };
        }

        wallet.setAttribute("entities", entities);

        walletRepository.index(wallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
        transactionHistoryService: Contracts.Shared.TransactionHistoryService,
    ): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);
        Utils.assert.defined<string>(transaction.data.asset?.registrationId);

        const wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});
        if (entities[transaction.data.asset.registrationId]) {
            delete entities[transaction.data.asset.registrationId].resigned;
        }

        wallet.setAttribute("entities", entities);

        walletRepository.index(wallet);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
