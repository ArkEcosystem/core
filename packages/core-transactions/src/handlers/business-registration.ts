import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Transactions } from "@arkecosystem/crypto";
import { BusinessRegistrationAssetError } from "../errors";
import { TransactionHandler } from "./transaction";

const { TransactionTypes } = Enums;

export class BusinessRegistrationTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.BusinessRegistration;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(
            TransactionTypes.BusinessRegistration,
        );
        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.business = transaction.asset.businessRegistration;
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(ApplicationEvents.BusinessRegistered, transaction.data);
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        const businessAsset: Interfaces.IBusinessRegistrationAsset = transaction.data.asset.businessRegistration;

        if (!businessAsset.name || !businessAsset.websiteAddress) {
            throw new BusinessRegistrationAssetError();
        }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        if (this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            return false;
        }

        const { name, websiteAddress, vat, githubRepository } = data.asset.businessRegistration;

        const findCommonTransactions = (tx: Interfaces.ITransactionData): boolean => {
            if (tx.type === TransactionTypes.BusinessRegistration) {
                const txAsset = tx.asset.businessRegistration;

                if (txAsset.name === name) {
                    return true;
                }

                if (txAsset.websiteAddress === websiteAddress) {
                    return true;
                }

                if (txAsset.vat !== undefined && txAsset.vat === vat) {
                    return true;
                }

                if (txAsset.githubRepository !== undefined && txAsset.githubRepository === githubRepository) {
                    return true;
                }
            }

            return false;
        };

        const sameBusinessRegistrationsDataInPayload = processor
            .getTransactions()
            .filter(tx => findCommonTransactions(tx) === true);

        if (sameBusinessRegistrationsDataInPayload.length > 1) {
            processor.pushError(
                data,
                "ERR_CONFLICT",
                `Multiple business registrations for "${name}", "${websiteAddress}", "${vat}", "${githubRepository}" in transaction payload`,
            );
            return false;
        }

        const businessRegistrationsInPool: Interfaces.ITransactionData[] = Array.from(
            pool.getTransactionsByType(TransactionTypes.BusinessRegistration),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);
        const containsBusinessRegistrationForSameNameInPool: boolean = businessRegistrationsInPool.some(
            transaction => findCommonTransactions(transaction) === true,
        );
        if (containsBusinessRegistrationForSameNameInPool) {
            processor.pushError(
                data,
                "ERR_PENDING",
                `Business registration for "${name}", "${websiteAddress}", "${vat}", "${githubRepository}" already in the pool`,
            );
            return false;
        }

        return true;
    }

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.business = transaction.data.asset.businessRegistration;

        walletManager.reindex(sender);
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        // add forget by
        sender.business = undefined;
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
