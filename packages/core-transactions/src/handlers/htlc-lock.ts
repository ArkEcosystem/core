import { app } from "@arkecosystem/core-container";
import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { HtlcLockExpiredError } from "../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

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

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const lockTransactions: Database.IBootstrapTransaction[] = await connection.transactionsRepository.getAssetsByType(
            this.getConstructor().type,
        );
        for (const transaction of lockTransactions) {
            const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const locks: Interfaces.IHtlcLocks = wallet.getAttribute("htlc.locks", {});
            locks[transaction.id] = {
                amount: transaction.amount,
                recipientId: transaction.recipientId,
                ...transaction.asset.lock,
            };
            wallet.setAttribute("htlc.locks", locks);

            const lockedBalance: Utils.BigNumber = wallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
            wallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(transaction.amount));
            walletManager.reindex(wallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): Promise<void> {
        const lock: Interfaces.IHtlcLockAsset = transaction.data.asset.lock;
        const lastBlock: Interfaces.IBlock = app
            .resolvePlugin<State.IStateService>("state")
            .getStore()
            .getLastBlock();

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

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const locks: Interfaces.IHtlcLocks = sender.getAttribute("htlc.locks", {});
        locks[transaction.id] = {
            amount: transaction.data.amount,
            recipientId: transaction.data.recipientId,
            ...transaction.data.asset.lock,
        };
        sender.setAttribute("htlc.locks", locks);

        const lockedBalance: Utils.BigNumber = sender.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        sender.setAttribute("htlc.lockedBalance", lockedBalance.plus(transaction.data.amount));

        walletManager.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const lockedBalance: Utils.BigNumber = sender.getAttribute("htlc.lockedBalance");
        sender.setAttribute("htlc.lockedBalance", lockedBalance.minus(transaction.data.amount));

        const locks: Interfaces.IHtlcLocks = sender.getAttribute("htlc.locks");
        delete locks[transaction.id];

        walletManager.reindex(sender);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}
}
