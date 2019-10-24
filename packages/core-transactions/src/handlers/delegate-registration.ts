import { Contracts, Enums as AppEnums, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import {
    NotSupportedForMultiSignatureWalletError,
    WalletIsAlreadyDelegateError,
    WalletNotADelegateError,
    WalletUsernameAlreadyRegisteredError,
} from "../errors";
import { TransactionReader } from "../transaction-reader";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

const { TransactionType, TransactionTypeGroup } = Enums;

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
export class DelegateRegistrationTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.DelegateRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [
            "delegate",
            "delegate.lastBlock",
            "delegate.rank",
            "delegate.round",
            "delegate.username",
            "delegate.voteBalance",
            "delegate.forgedTotal",
            "delegate.approval",
        ];
    }

    public async bootstrap(
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const forgedBlocks = await connection.blocksRepository.getDelegatesForgedBlocks();
        const lastForgedBlocks = await connection.blocksRepository.getLastForgedBlocks();

        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.senderPublicKey);

                if (transaction.asset && transaction.asset.delegate) {
                    wallet.setAttribute<Contracts.State.WalletDelegateAttributes>("delegate", {
                        username: transaction.asset.delegate.username,
                        voteBalance: Utils.BigNumber.ZERO,
                        forgedFees: Utils.BigNumber.ZERO,
                        forgedRewards: Utils.BigNumber.ZERO,
                        producedBlocks: 0,
                        rank: undefined,
                    });

                    walletRepository.reindex(wallet);
                }
            }
        }

        for (const block of forgedBlocks) {
            const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(block.generatorPublicKey);

            // Genesis wallet is empty
            if (!wallet.hasAttribute("delegate")) {
                continue;
            }

            const delegate: Contracts.State.WalletDelegateAttributes = wallet.getAttribute("delegate");
            delegate.forgedFees = delegate.forgedFees.plus(block.totalFees);
            delegate.forgedRewards = delegate.forgedRewards.plus(block.totalRewards);
            delegate.producedBlocks += +block.totalProduced;
        }

        for (const block of lastForgedBlocks) {
            const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(block.generatorPublicKey);

            wallet.setAttribute("delegate.lastBlock", block);
        }
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        const sender: Contracts.State.Wallet = databaseWalletRepository.findByPublicKey(
            AppUtils.assert.defined(data.senderPublicKey),
        );

        if (sender.hasMultiSignature()) {
            throw new NotSupportedForMultiSignatureWalletError();
        }

        const { username }: { username: string } = AppUtils.assert.defined(data.asset!.delegate);

        if (!username) {
            throw new WalletNotADelegateError();
        }

        if (wallet.isDelegate()) {
            throw new WalletIsAlreadyDelegateError();
        }

        if (databaseWalletRepository.hasByUsername(username)) {
            throw new WalletUsernameAlreadyRegisteredError(username);
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.EventDispatcher): void {
        emitter.dispatch(AppEnums.Events.State.DelegateRegistered, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        if (await this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            return false;
        }

        const { username }: { username: string } = AppUtils.assert.defined(data.asset!.delegate);
        const delegateRegistrationsSameNameInPayload = processor
            .getTransactions()
            .filter(
                transaction =>
                    transaction.type === TransactionType.DelegateRegistration &&
                    (transaction.typeGroup === undefined || transaction.typeGroup === TransactionTypeGroup.Core) &&
                    transaction.asset &&
                    transaction.asset.delegate &&
                    transaction.asset.delegate.username === username,
            );

        if (delegateRegistrationsSameNameInPayload.length > 1) {
            processor.pushError(
                data,
                "ERR_CONFLICT",
                `Multiple delegate registrations for "${username}" in transaction payload`,
            );
            return false;
        }

        const delegateRegistrationsInPool: Interfaces.ITransactionData[] = Array.from(
            await pool.getTransactionsByType(TransactionType.DelegateRegistration),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);

        const containsDelegateRegistrationForSameNameInPool: boolean = delegateRegistrationsInPool.some(
            transaction =>
                transaction.asset && transaction.asset.delegate && transaction.asset.delegate.username === username,
        );
        if (containsDelegateRegistrationForSameNameInPool) {
            processor.pushError(data, "ERR_PENDING", `Delegate registration for "${username}" already in the pool`);
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
            AppUtils.assert.defined(transaction.data.senderPublicKey),
        );

        sender.setAttribute<Contracts.State.WalletDelegateAttributes>("delegate", {
            username: AppUtils.assert.defined(transaction.data.asset!.delegate!.username),
            voteBalance: Utils.BigNumber.ZERO,
            forgedFees: Utils.BigNumber.ZERO,
            forgedRewards: Utils.BigNumber.ZERO,
            producedBlocks: 0,
            round: 0,
        });

        walletRepository.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
            AppUtils.assert.defined(transaction.data.senderPublicKey),
        );

        walletRepository.forgetByUsername(sender.getAttribute("delegate.username"));

        sender.forgetAttribute("delegate");
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {}
}
