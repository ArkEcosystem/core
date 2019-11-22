import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { HtlcLockExpiredError } from "../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
@Container.injectable()
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

    public async bootstrap(): Promise<void> {
        const transactions = await this.transactionRepository.getOpenHtlcLocks();
        const walletsToIndex: Record<string, Contracts.State.Wallet> = {};
        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const locks: Interfaces.IHtlcLocks = wallet.getAttribute("htlc.locks", {});

            let lockedBalance: Utils.BigNumber = wallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);

            if (transaction.open) {
                locks[transaction.id] = {
                    amount: Utils.BigNumber.make(transaction.amount),
                    recipientId: transaction.recipientId,
                    timestamp: transaction.timestamp,
                    vendorField: transaction.vendorField
                        ? Buffer.from(transaction.vendorField, "hex").toString("utf8")
                        : undefined,
                    ...transaction.asset.lock,
                };

                lockedBalance = lockedBalance.plus(transaction.amount);

                const recipientWallet: Contracts.State.Wallet = this.walletRepository.findByAddress(
                    transaction.recipientId,
                );
                walletsToIndex[wallet.address] = wallet;
                walletsToIndex[recipientWallet.address] = recipientWallet;
            }

            wallet.setAttribute("htlc.locks", locks);
            wallet.setAttribute("htlc.lockedBalance", lockedBalance);
        }

        this.walletRepository.index(Object.values(walletsToIndex));
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        AppUtils.assert.defined<Interfaces.IHtlcLockAsset>(transaction.data.asset?.lock);

        const lock: Interfaces.IHtlcLockAsset = transaction.data.asset.lock;
        const lastBlock: Interfaces.IBlock = this.app.get<any>(Container.Identifiers.StateStore).getLastBlock();

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

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
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
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        AppUtils.assert.defined<Contracts.State.Wallet>(sender);

        AppUtils.assert.defined<Interfaces.IHtlcLockAsset>(transaction.data.asset?.lock);

        const locks: Interfaces.IHtlcLocks = sender.getAttribute("htlc.locks", {});
        locks[transaction.id!] = {
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
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const lockedBalance: Utils.BigNumber = sender.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        sender.setAttribute("htlc.lockedBalance", lockedBalance.minus(transaction.data.amount));

        const locks: Interfaces.IHtlcLocks = sender.getAttribute("htlc.locks", {});

        AppUtils.assert.defined<string>(transaction.id);

        delete locks[transaction.id];

        walletRepository.reindex(sender);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {}
}
