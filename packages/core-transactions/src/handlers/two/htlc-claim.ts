import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { strict } from "assert";

import { HtlcLockExpiredError, HtlcLockTransactionNotFoundError, HtlcSecretHashMismatchError } from "../../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";
import { HtlcLockTransactionHandler } from "./htlc-lock";

@Container.injectable()
export class HtlcClaimTransactionHandler extends TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [HtlcLockTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.HtlcClaimTransaction;
    }

    public async bootstrap(): Promise<void> {
        const transactions = await this.transactionRepository.getClaimedHtlcLockBalances();
        for (const transaction of transactions) {
            const claimWallet: Contracts.State.Wallet = this.walletRepository.findByAddress(transaction.recipientId);
            claimWallet.balance = claimWallet.balance.plus(transaction.amount);
        }
    }

    public async isActivated(): Promise<boolean> {
        const milestone = Managers.configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true;
    }

    public dynamicFee(context: Contracts.Shared.DynamicFeeContext): Utils.BigNumber {
        // override dynamicFee calculation as this is a zero-fee transaction
        return Utils.BigNumber.ZERO;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await this.performGenericWalletChecks(transaction, sender, customWalletRepository);

        // Specific HTLC claim checks
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<Interfaces.ITransactionAsset>(transaction.data.asset?.claim);

        const claimAsset: Interfaces.IHtlcClaimAsset = transaction.data.asset.claim;
        const lockId: string = claimAsset.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = walletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            throw new HtlcLockTransactionNotFoundError();
        }

        const lock: Interfaces.IHtlcLock = lockWallet.getAttribute("htlc.locks", {})[lockId];
        const lastBlock: Interfaces.IBlock = this.app
            .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
            .getLastBlock();

        if (AppUtils.expirationCalculator.calculateLockExpirationStatus(lastBlock, lock.expiration)) {
            throw new HtlcLockExpiredError();
        }

        const unlockSecretBytes = Buffer.from(claimAsset.unlockSecret, "hex");
        const unlockSecretHash: string = Crypto.HashAlgorithms.sha256(unlockSecretBytes).toString("hex");
        if (lock.secretHash !== unlockSecretHash) {
            throw new HtlcSecretHashMismatchError();
        }
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.asset?.claim?.lockTransactionId);

        const lockId: string = transaction.data.asset.claim.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = this.walletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );

        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            throw new Contracts.TransactionPool.PoolError(
                `The associated lock transaction id "${lockId}" was not found`,
                "ERR_HTLCLOCKNOTFOUND",
                transaction,
            );
        }

        const hasClaim: boolean = this.poolQuery
            .getAll()
            .whereKind(transaction)
            .wherePredicate(t => t.data.asset?.claim?.lockTransactionId === lockId)
            .has();

        if (hasClaim) {
            throw new Contracts.TransactionPool.PoolError(
                `HtlcClaim for "${lockId}" already in the pool`,
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

        if (Utils.isException(data.id)) {
            this.app.log.warning(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }

        await this.throwIfCannotBeApplied(transaction, sender, customWalletRepository);

        this.verifyTransactionNonceApply(sender, transaction);

        AppUtils.assert.defined<AppUtils.BigNumber>(data.nonce);

        sender.nonce = data.nonce;

        AppUtils.assert.defined<string>(data.asset?.claim?.lockTransactionId);

        const lockId: string = data.asset.claim.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = walletRepository.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );

        strict(lockWallet && lockWallet.getAttribute("htlc.locks")[lockId]);

        const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks", {});

        const recipientId: string | undefined = locks[lockId].recipientId;

        AppUtils.assert.defined<string>(recipientId);

        const recipientWallet: Contracts.State.Wallet = walletRepository.findByAddress(recipientId);

        const newBalance: Utils.BigNumber = recipientWallet.balance.plus(locks[lockId].amount).minus(data.fee);

        recipientWallet.balance = newBalance;
        const lockedBalance: Utils.BigNumber = lockWallet.getAttribute("htlc.lockedBalance");
        const newLockedBalance: Utils.BigNumber = lockedBalance.minus(locks[lockId].amount);

        strict(!newLockedBalance.isNegative());

        lockWallet.setAttribute("htlc.lockedBalance", newLockedBalance);

        delete locks[lockId];

        walletRepository.reindex(sender);
        walletRepository.reindex(lockWallet);
        walletRepository.reindex(recipientWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const data: Interfaces.ITransactionData = transaction.data;

        this.verifyTransactionNonceRevert(sender, transaction);

        sender.nonce = sender.nonce.minus(1);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(data.asset?.claim?.lockTransactionId);

        const lockId: string = data.asset.claim.lockTransactionId;
        // @ts-ignore - Type 'Transaction' is not assignable to type 'ITransactionData'.
        const lockTransaction: Interfaces.ITransactionData = (await this.transactionRepository.findByIds([lockId]))[0];

        AppUtils.assert.defined<Interfaces.ITransactionData>(lockTransaction.recipientId);

        const recipientWallet: Contracts.State.Wallet = walletRepository.findByAddress(lockTransaction.recipientId);
        recipientWallet.balance = recipientWallet.balance.minus(lockTransaction.amount).plus(data.fee);

        AppUtils.assert.defined<string>(lockTransaction.senderPublicKey);

        const lockWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(lockTransaction.senderPublicKey);
        const lockedBalance: Utils.BigNumber = lockWallet.getAttribute("htlc.lockedBalance");
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));

        const locks: Interfaces.IHtlcLocks = lockWallet.getAttribute("htlc.locks");

        AppUtils.assert.defined<Interfaces.IHtlcLockAsset>(lockTransaction.asset?.lock);

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

        walletRepository.reindex(sender);
        walletRepository.reindex(lockWallet);
        walletRepository.reindex(recipientWallet);
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
