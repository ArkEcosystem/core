import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { IEntityAsset } from "@arkecosystem/core-magistrate-crypto/dist/interfaces";
import { Interfaces } from "@arkecosystem/crypto";

import { EntityAlreadyRegisteredError, EntityNameAlreadyRegisteredError } from "../../errors";
import { IEntitiesWallet, IEntityWallet } from "../../interfaces";
import { MagistrateIndex } from "../../wallet-indexes";

// Entity Register sub-handler : most of the sub-handler methods are implemented here
// but it is extended by the bridgechain, business, developer, plugin... subhandlers
@Container.injectable()
export class EntityRegisterSubHandler {
    public async bootstrap(
        walletRepository: Contracts.State.WalletRepository,
        transactionHistoryService: Contracts.Shared.TransactionHistoryService,
        criteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<void> {
        await transactionHistoryService.streamManyByCriteria(criteria, (transaction) => {
            Utils.assert.defined<string>(transaction.id);
            Utils.assert.defined<string>(transaction.senderPublicKey);
            Utils.assert.defined<object>(transaction.asset);
            // Utils.assert.defined<IEntityAsset>(transaction.asset); // WTF?

            const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.senderPublicKey);
            const entities: IEntitiesWallet = wallet.getAttribute<IEntitiesWallet>("entities", {});

            entities[transaction.id] = {
                type: transaction.asset.type,
                subType: transaction.asset.subType,
                data: transaction.asset.data,
            };

            wallet.setAttribute("entities", entities);

            walletRepository.index(wallet);
        });
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        Utils.assert.defined<string>(transaction.id);

        const walletEntities = wallet.getAttribute("entities", {});
        if (walletEntities[transaction.id]) {
            throw new EntityAlreadyRegisteredError();
        }

        for (const wallet of walletRepository.getIndex(MagistrateIndex.Entities).values()) {
            if (wallet.hasAttribute("entities")) {
                const entityValues: IEntityWallet[] = Object.values(wallet.getAttribute("entities"));

                if (
                    entityValues.some(
                        (entity) =>
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

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {}

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);
        Utils.assert.defined<string>(transaction.id);
        Utils.assert.defined<IEntityAsset>(transaction.data.asset);

        const wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});
        entities[transaction.id] = {
            type: transaction.data.asset.type,
            subType: transaction.data.asset.subType,
            data: { ...transaction.data.asset.data },
        };

        wallet.setAttribute("entities", entities);

        walletRepository.index(wallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
        transactionHistoryService: Contracts.Shared.TransactionHistoryService,
    ): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);
        Utils.assert.defined<string>(transaction.id);

        const wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});
        delete entities[transaction.id];

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
