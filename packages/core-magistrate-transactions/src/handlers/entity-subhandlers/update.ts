import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import { EntityNotRegisteredError, EntityAlreadyResignedError, EntityWrongTypeError, EntityWrongSubTypeError } from "../../errors";
import { IEntityAssetData, IEntityAsset } from "@arkecosystem/core-magistrate-crypto/dist/interfaces";
import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { IEntityWallet, IEntitiesWallet } from "../../interfaces";
import { TransactionReader } from "@arkecosystem/core-transactions";
import { Models } from "@arkecosystem/core-database";

// Entity Register sub-handler : most of the sub-handler methods are implemented here
// but it is extended by the bridgechain, business, developer, plugin... subhandlers
@Container.injectable()
export class EntityUpdateSubHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    protected readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public async bootstrap(
        walletRepository: Contracts.State.WalletRepository,
        reader: TransactionReader
    ): Promise<void> {
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.senderPublicKey);
            const entities: IEntitiesWallet = wallet.getAttribute<IEntitiesWallet>("entities");

            entities[transaction.asset.registrationId] = {
                type: entities[transaction.asset.registrationId].type,
                subType: entities[transaction.asset.registrationId].subType,
                data: this.mergeAssetData(entities[transaction.asset.registrationId].data, transaction.asset.data),
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

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);
        Utils.assert.defined<string>(transaction.id);
        Utils.assert.defined<string>(transaction.data.asset?.registrationId);
        Utils.assert.defined<IEntityAssetData>(transaction.data.asset?.data);

        const assetData: IEntityAssetData = transaction.data.asset.data;

        const wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const entities = wallet.getAttribute("entities", {});
        if (entities[transaction.data.asset.registrationId]) {
            entities[transaction.data.asset.registrationId] = {
                ...entities[transaction.data.asset.registrationId],
                data: this.mergeAssetData(entities[transaction.data.asset.registrationId].data, assetData),
            };
        }
        
        wallet.setAttribute("entities", entities);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
        transactionHistoryService: Contracts.Shared.TransactionHistoryService,
    ): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);
        Utils.assert.defined<object>(transaction.data.asset);

        // Here we have to "replay" entity registration and update transactions associated with the registration id
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const entities = sender.getAttribute("entities", {});
        const registrationId: string = transaction.data.asset.registrationId;

        const registrationTransaction = await transactionHistoryService.findOneByCriteria([{ id: registrationId }]);

        Utils.assert.defined<Interfaces.ITransactionData>(registrationTransaction);
        Utils.assert.defined<IEntityAsset>(registrationTransaction.asset);

        const baseEntity: IEntityWallet = {
            type: registrationTransaction.asset.type,
            subType: registrationTransaction.asset.subType,
            data: { ...registrationTransaction.asset.data },
        };

        const updateTransactions = await transactionHistoryService.findManyByCriteria([
            {
                senderPublicKey: transaction.data.senderPublicKey,
                typeGroup: Enums.MagistrateTransactionGroup,
                type: Enums.MagistrateTransactionType.Entity,
                asset: { registrationId },
            },
        ]);

        let mergedData = baseEntity.data;
        for (const updateTransaction of updateTransactions) {
            if (updateTransaction.id === transaction.id) {
                continue;
            }
            mergedData = this.mergeAssetData(mergedData, updateTransaction.asset!.data);
        }

        entities[registrationId] = {
            type: baseEntity.type,
            subType: baseEntity.subType,
            data: mergedData,
        };

        sender.setAttribute("entities", entities);

        walletRepository.index(sender);
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

    private mergeAssetData(baseData: IEntityAssetData, dataToMerge: IEntityAssetData): IEntityAssetData {
        return {
            ...baseData,
            ...dataToMerge,
        };
    }
}
