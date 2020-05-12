import { Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions, Types } from "@arkecosystem/crypto";
import assert from "assert";

import { HtlcLockNotExpiredError, HtlcLockTransactionNotFoundError } from "../../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";
import { HtlcLockTransactionHandler } from "./htlc-lock";

@Container.injectable()
export class HtlcRefundTransactionHandler extends TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [HtlcLockTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor<BlockInterfaces.IBlockData> {
        return Transactions.Two.HtlcRefundTransaction;
    }

    public async bootstrap(): Promise<void> {
        const transactions = await this.transactionRepository.getRefundedHtlcLockBalances();

        for (const transaction of transactions) {
            const refundWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                transaction.senderPublicKey,
            ); // sender is from the original lock

            refundWallet.balance = refundWallet.balance.plus(transaction.amount);
        }
    }

    public async isActivated(): Promise<boolean> {
        const milestone = this.cryptoManager.MilestoneManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true;
    }

    public dynamicFee(context: Contracts.Shared.DynamicFeeContext): Types.BigNumber {
        // override dynamicFee calculation as this is a zero-fee transaction
        return this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await this.performGenericWalletChecks(transaction, sender, customWalletRepository);

        AppUtils.assert.defined<string>(transaction.data.asset?.refund);

        // Specific HTLC refund checks
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<Interfaces.IHtlcRefundAsset>(transaction.data.asset.refund);

        const lockId: string = transaction.data.asset.refund.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = walletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks")[lockId]) {
            throw new HtlcLockTransactionNotFoundError();
        }

        const lock: Interfaces.IHtlcLock = lockWallet.getAttribute("htlc.locks", {})[lockId];
        const lastBlock: BlockInterfaces.IBlock = this.app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getLastBlock();

        if (!AppUtils.expirationCalculator.calculateLockExpirationStatus(lastBlock, lock.expiration)) {
            throw new HtlcLockNotExpiredError();
        }
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.asset?.refund?.lockTransactionId);

        const lockId: string = transaction.data.asset.refund.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = this.walletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );

        if (!lockWallet || !lockWallet.getAttribute("htlc.locks")[lockId]) {
            throw new Contracts.TransactionPool.PoolError(
                `The associated lock transaction id "${lockId}" was not found`,
                "ERR_HTLCLOCKNOTFOUND",
                transaction,
            );
        }

        const hasRefund = this.poolQuery
            .getAll()
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset?.refund?.lockTransactionId === lockId)
            .has();

        if (hasRefund) {
            throw new Contracts.TransactionPool.PoolError(
                `HtlcRefund for "${lockId}" already in the pool`,
                "ERR_PENDING",
                transaction,
            );
        }
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const data: Interfaces.ITransactionData = transaction.data;

        if (this.cryptoManager.LibraryManager.Utils.isException(data.id)) {
            this.app.log.warning(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }

        await this.throwIfCannotBeApplied(transaction, sender, customWalletRepository);

        this.verifyTransactionNonceApply(sender, transaction);

        AppUtils.assert.defined<AppUtils.BigNumber>(data.nonce);

        sender.nonce = data.nonce;

        AppUtils.assert.defined<string>(data.asset?.refund?.lockTransactionId);

        const lockId: string = data.asset.refund.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = walletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );

        assert(lockWallet && lockWallet.getAttribute("htlc.locks", {})[lockId]);

        const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks", {});
        const newBalance: Types.BigNumber = lockWallet.balance.plus(locks[lockId].amount).minus(data.fee);
        assert(!newBalance.isNegative());

        lockWallet.balance = newBalance;
        const lockedBalance: Types.BigNumber = lockWallet.getAttribute(
            "htlc.lockedBalance",
            this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
        );

        const newLockedBalance: Types.BigNumber = lockedBalance.minus(locks[lockId].amount);

        assert(!newLockedBalance.isNegative());
        lockWallet.setAttribute("htlc.lockedBalance", newLockedBalance);

        delete locks[lockId];

        walletRepository.index(lockWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        this.verifyTransactionNonceRevert(sender, transaction);

        sender.nonce = sender.nonce.minus(1);

        AppUtils.assert.defined<string>(transaction.data.asset?.refund?.lockTransactionId);

        const lockId: string = transaction.data.asset.refund.lockTransactionId;
        // @ts-ignore - Type 'Transaction' is not assignable to type 'ITransactionData'.
        const lockTransaction: Interfaces.ITransactionData = (await this.transactionRepository.findByIds([lockId]))[0];

        AppUtils.assert.defined<string>(lockTransaction.senderPublicKey);

        const lockWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(lockTransaction.senderPublicKey);

        lockWallet.balance = lockWallet.balance.minus(lockTransaction.amount).plus(transaction.data.fee);

        const lockedBalance: Types.BigNumber = lockWallet.getAttribute("htlc.lockedBalance");
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));

        const locks: Interfaces.IHtlcLocks | undefined = lockWallet.getAttribute("htlc.locks");

        AppUtils.assert.defined<Interfaces.IHtlcLockAsset>(lockTransaction.asset?.lock);

        if (locks) {
            AppUtils.assert.defined<string>(lockTransaction.id);

            locks[lockTransaction.id] = {
                amount: lockTransaction.amount,
                recipientId: lockTransaction.recipientId,
                timestamp: lockTransaction.timestamp,
                vendorField: lockTransaction.vendorField
                    ? Buffer.from(lockTransaction.vendorField, "hex").toString("utf8")
                    : undefined,
                ...lockTransaction.asset.lock,
            };
        }

        walletRepository.index(lockWallet);
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
