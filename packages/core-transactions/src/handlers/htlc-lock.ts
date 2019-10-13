import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions, Utils, Enums } from "@arkecosystem/crypto";

import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";
import { HtlcLockExpiredError } from "../errors";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
export class HtlcLockTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.HtlcLockTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["htlc.locks", "htlc.lockedBalance"];
    }

    public async bootstrap(
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const transactions = await connection.transactionsRepository.getOpenHtlcLocks();

        const walletsToIndex: Record<string, Contracts.State.Wallet> = {};
        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.senderPublicKey);
            const locks: Interfaces.IHtlcLocks = wallet.getAttribute("htlc.locks", {});
            locks[transaction.id] = {
                amount: Utils.BigNumber.make(transaction.amount),
                recipientId: transaction.recipientId,
                timestamp: transaction.timestamp,
                vendorField: transaction.vendorField ? transaction.vendorField : undefined,
                ...transaction.asset.lock,
            };
            wallet.setAttribute("htlc.locks", locks);

            const lockedBalance: Utils.BigNumber = wallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
            wallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(transaction.amount));

            const recipientWallet: Contracts.State.Wallet = walletRepository.findByAddress(transaction.recipientId);

            walletsToIndex[wallet.address] = wallet;
            walletsToIndex[recipientWallet.address] = recipientWallet;
        }

        walletRepository.index(Object.values(walletsToIndex));
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const lock: Interfaces.IHtlcLockAsset = transaction.data.asset.lock;
        const lastBlock: Interfaces.IBlock = app.get<any>(Container.Identifiers.StateStore).getLastBlock();

        let { blocktime, activeDelegates } = Managers.configManager.getMilestone();
        const expiration: Interfaces.IHtlcExpiration = lock.expiration;

        // TODO: find a better way to alter minimum lock expiration
        if (process.env.CORE_ENV === "test") {
            blocktime = 0;
            activeDelegates = 0;
        }

        if (
            (expiration.type === Enums.HtlcLockExpirationType.EpochTimestamp &&
                expiration.value <= lastBlock.data.timestamp + blocktime * activeDelegates) ||
            (expiration.type === Enums.HtlcLockExpirationType.BlockHeight &&
                expiration.value <= lastBlock.data.height + activeDelegates)
        ) {
            throw new HtlcLockExpiredError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletRepository);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const locks: Interfaces.IHtlcLocks = sender.getAttribute("htlc.locks", {});
        locks[transaction.id] = {
            amount: transaction.data.amount,
            recipientId: transaction.data.recipientId,
            timestamp: transaction.timestamp,
            vendorField: transaction.data.vendorField,
            ...transaction.data.asset.lock,
        };
        sender.setAttribute("htlc.locks", locks);

        const lockedBalance: Utils.BigNumber = sender.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        sender.setAttribute("htlc.lockedBalance", lockedBalance.plus(transaction.data.amount));

        walletRepository.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const lockedBalance: Utils.BigNumber = sender.getAttribute("htlc.lockedBalance");
        sender.setAttribute("htlc.lockedBalance", lockedBalance.minus(transaction.data.amount));

        const locks: Interfaces.IHtlcLocks = sender.getAttribute("htlc.locks");
        delete locks[transaction.id];

        walletRepository.reindex(sender);
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
