import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { HtlcLockExpiredError } from "../../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
@Container.injectable()
export class HtlcLockTransactionHandler extends TransactionHandler {
    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["htlc", "htlc.locks", "htlc.lockedBalance"];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.HtlcLockTransaction;
    }

    public async bootstrap(): Promise<void> {
        const transactions = await this.transactionRepository.getOpenHtlcLocks();
        const walletsToIndex: Record<string, Contracts.State.Wallet> = {};
        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const locks: Interfaces.IHtlcLocks = wallet.getAttribute("htlc.locks", {});

            let lockedBalance: Utils.BigNumber = wallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);

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
            walletsToIndex[wallet.getAddress()] = wallet;
            walletsToIndex[recipientWallet.getAddress()] = recipientWallet;

            wallet.setAttribute("htlc.locks", locks);
            wallet.setAttribute("htlc.lockedBalance", lockedBalance);
        }

        for (const wallet of Object.values(walletsToIndex)) {
            this.walletRepository.index(wallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        const milestone = Managers.configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<Interfaces.IHtlcLockAsset>(transaction.data.asset?.lock);

        const lock: Interfaces.IHtlcLockAsset = transaction.data.asset.lock;
        const lastBlock: Interfaces.IBlock = this.app.get<any>(Container.Identifiers.StateStore).getLastBlock();

        let { activeDelegates } = Managers.configManager.getMilestone();
        let blocktime = Utils.calculateBlockTime(lastBlock.data.height);
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

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const lockedBalance = sender.getAttribute<Utils.BigNumber>("htlc.lockedBalance", Utils.BigNumber.ZERO);
        sender.setAttribute("htlc.lockedBalance", lockedBalance.plus(transaction.data.amount));

        this.walletRepository.index(sender);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const lockedBalance = sender.getAttribute<Utils.BigNumber>("htlc.lockedBalance", Utils.BigNumber.ZERO);
        sender.setAttribute("htlc.lockedBalance", lockedBalance.minus(transaction.data.amount));

        this.walletRepository.index(sender);
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {
        // It may seem that htlc-lock doesn't have recipient because it only updates sender's wallet.
        // But actually applyToSender applies state changes that only affect sender.
        // While applyToRecipient applies state changes that can affect others.
        // It is simple technique to isolate different senders in pool.

        AppUtils.assert.defined<string>(transaction.id);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<Interfaces.IHtlcLockAsset>(transaction.data.asset?.lock);

        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const locks = sender.getAttribute<Interfaces.IHtlcLocks>("htlc.locks", {});
        locks[transaction.id] = {
            amount: transaction.data.amount,
            recipientId: transaction.data.recipientId,
            timestamp: transaction.timestamp,
            vendorField: transaction.data.vendorField,
            ...transaction.data.asset.lock,
        };
        sender.setAttribute("htlc.locks", locks);

        this.walletRepository.index(sender);
    }

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.id);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const locks = sender.getAttribute<Interfaces.IHtlcLocks>("htlc.locks", {});
        delete locks[transaction.id];
        sender.setAttribute("htlc.locks", locks);

        this.walletRepository.index(sender);
    }
}
