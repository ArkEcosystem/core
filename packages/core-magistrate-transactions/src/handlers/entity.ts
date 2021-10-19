import { Container, Contracts, Utils as KernelUtils } from "@arkecosystem/core-kernel";
import {
    Enums,
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces as CryptoInterfaces, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

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
import { MagistrateIndex } from "../wallet-indexes";

@Container.injectable()
export class EntityTransactionHandler extends Handlers.TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.EntityTransaction;
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip36 === true;
    }

    public dynamicFee(context: Contracts.Shared.DynamicFeeContext): Utils.BigNumber {
        return this.getConstructor().staticFee({ data: context.transaction.data });
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["entities"];
    }

    public async bootstrap(): Promise<void> {
        for await (const transaction of this.transactionHistoryService.streamByCriteria({
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        })) {
            KernelUtils.assert.defined<string>(transaction.senderPublicKey);

            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);

            this.applyTransactionToWallet(transaction, wallet);
        }
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        KernelUtils.assert.defined<object>(transaction.data.asset);

        if (transaction.data.asset.action === Enums.EntityAction.Register) {
            KernelUtils.assert.defined<object>(transaction.data.asset.data.name);
            const name = transaction.data.asset.data.name;

            const hasName: boolean = this.poolQuery
                .getAll()
                .whereKind(transaction)
                .wherePredicate((t) => t.data.asset?.type === transaction.data.asset!.type)
                .wherePredicate((t) => t.data.asset?.data.name.toLowerCase() === name.toLowerCase())
                .has();

            if (hasName) {
                throw new Contracts.TransactionPool.PoolError(
                    `Entity registration for "${name}" already in the pool`,
                    "ERR_PENDING",
                );
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

        const staticFee: Utils.BigNumber = this.getConstructor().staticFee({ data: transaction.data });
        if (!transaction.data.fee.isEqualTo(staticFee)) {
            throw new StaticFeeMismatchError(staticFee.toFixed());
        }

        await super.throwIfCannotBeApplied(transaction, wallet);

        KernelUtils.assert.defined<object>(transaction.data.asset);

        const walletEntities = wallet.getAttribute("entities", {});
        if (transaction.data.asset.action === Enums.EntityAction.Register) {
            if (walletEntities[transaction.id!]) {
                throw new EntityAlreadyRegisteredError();
            }

            if (
                this.walletRepository.hasByIndex(
                    MagistrateIndex.EntityNamesTypes,
                    `${transaction.data.asset.data.name}-${transaction.data.asset.type}`,
                )
            ) {
                throw new EntityNameAlreadyRegisteredError();
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

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        return;
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey!);

        this.applyTransactionToWallet(transaction.data, wallet);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        KernelUtils.assert.defined<object>(transaction.data.asset);

        await super.revertForSender(transaction);

        const wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey!);

        const entities = wallet.getAttribute("entities", {});

        switch (transaction.data.asset!.action) {
            case Enums.EntityAction.Register:
                delete entities[transaction.id!];

                this.walletRepository.forgetOnIndex(
                    MagistrateIndex.EntityNamesTypes,
                    `${transaction.data.asset.data.name}-${transaction.data.asset.type}`,
                );
                this.walletRepository.forgetOnIndex(MagistrateIndex.Entities, transaction.id!);
                break;
            case Enums.EntityAction.Update:
                return this.revertForSenderUpdate(transaction, this.walletRepository);
            case Enums.EntityAction.Resign:
                delete entities[transaction.data.asset!.registrationId].resigned;
                break;
        }

        wallet.setAttribute("entities", entities);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}

    private async revertForSenderUpdate(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        KernelUtils.assert.defined<string>(transaction.data.senderPublicKey);
        KernelUtils.assert.defined<object>(transaction.data.asset);

        // Here we have to "replay" entity registration and update transactions associated with the registration id
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const entities = sender.getAttribute("entities", {});
        const registrationId: string = transaction.data.asset.registrationId;

        const registrationTransaction = await this.transactionHistoryService.findOneByCriteria([
            { id: registrationId },
        ]);

        KernelUtils.assert.defined<Interfaces.ITransactionData>(registrationTransaction);
        KernelUtils.assert.defined<MagistrateInterfaces.IEntityAsset>(registrationTransaction.asset);

        const baseEntity: IEntityWallet = {
            type: registrationTransaction.asset.type,
            subType: registrationTransaction.asset.subType,
            data: { ...registrationTransaction.asset.data },
        };

        const updateTransactions = await this.transactionHistoryService.findManyByCriteria([
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
            mergedData = { ...mergedData, ...updateTransaction.asset!.data };
        }

        entities[registrationId] = {
            type: baseEntity.type,
            subType: baseEntity.subType,
            data: mergedData,
        };

        sender.setAttribute("entities", entities);
    }

    private applyTransactionToWallet(
        transaction: Contracts.Database.TransactionModel | Interfaces.ITransactionData,
        wallet: Contracts.State.Wallet,
    ): void {
        const entities: IEntitiesWallet = wallet.getAttribute<IEntitiesWallet>("entities", {});

        KernelUtils.assert.defined<object>(transaction.asset);

        switch (transaction.asset!.action) {
            case Enums.EntityAction.Register:
                entities[transaction.id!] = {
                    type: transaction.asset!.type,
                    subType: transaction.asset!.subType,
                    data: transaction.asset!.data,
                };

                this.walletRepository.setOnIndex(
                    MagistrateIndex.EntityNamesTypes,
                    `${transaction.asset.data.name}-${transaction.asset.type}`,
                    wallet,
                );
                this.walletRepository.setOnIndex(MagistrateIndex.Entities, transaction.id!, wallet);
                break;
            case Enums.EntityAction.Update:
                entities[transaction.asset!.registrationId] = {
                    type: entities[transaction.asset!.registrationId].type,
                    subType: entities[transaction.asset!.registrationId].subType,
                    data: { ...entities[transaction.asset!.registrationId].data, ...transaction.asset!.data },
                };
                break;
            case Enums.EntityAction.Resign:
                entities[transaction.asset!.registrationId] = {
                    ...entities[transaction.asset!.registrationId],
                    resigned: true,
                };
                break;
        }

        wallet.setAttribute("entities", entities);
    }
}
