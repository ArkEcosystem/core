import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Identifiers } from "../identifiers";
import { HtlcLock, HtlcLockCriteria, HtlcLocksPage } from "./htlc-lock";
import { WalletService } from "./wallet-service";

@Container.injectable()
export class HtlcLockService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Identifiers.WalletService)
    private readonly walletService!: WalletService;

    public getLock(lockId: string): HtlcLock | undefined {
        if (!this.walletRepository.hasByIndex(Contracts.State.WalletIndexes.Locks, lockId)) {
            return undefined;
        }

        const wallet = this.walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);

        return this.getLockResource(wallet, lockId);
    }

    public *getLocks(...criterias: HtlcLockCriteria[]): Iterable<HtlcLock> {
        for (const [lockId, wallet] of this.walletRepository.getIndex(Contracts.State.WalletIndexes.Locks).entries()) {
            const lock = this.getLockResource(wallet, lockId);

            if (AppUtils.Search.testCriterias(lock, ...criterias)) {
                yield lock;
            }
        }
    }

    public *getWalletLocks(walletId: string, ...criterias: HtlcLockCriteria[]): Iterable<HtlcLock> {
        const wallet = this.walletService.getWallet(walletId);

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        for (const lockId of Object.keys(wallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks", {}))) {
            const lock = this.getLockResource(wallet, lockId);

            if (AppUtils.Search.testCriterias(lock, ...criterias)) {
                yield lock;
            }
        }
    }

    public getLocksPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: HtlcLockCriteria[]
    ): HtlcLocksPage {
        ordering = [ordering, "timestamp:desc"];

        return AppUtils.Search.getPage(pagination, ordering, this.getLocks(...criterias));
    }

    public getWalletLocksPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        walletId: string,
        ...criterias: HtlcLockCriteria[]
    ): HtlcLocksPage {
        ordering = [ordering, "timestamp:desc"];

        return AppUtils.Search.getPage(pagination, ordering, this.getWalletLocks(walletId, ...criterias));
    }

    private getLockResource(wallet: Contracts.State.Wallet, lockId: string): HtlcLock {
        const walletLocks = wallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks");
        const walletLock = walletLocks[lockId];

        // todo: fix index, so walletLocks[lockId] is guaranteed to exist
        AppUtils.assert.defined<Interfaces.IHtlcLock>(walletLock);
        AppUtils.assert.defined<string>(walletLock.recipientId);
        AppUtils.assert.defined<string>(wallet.publicKey);

        const senderPublicKey = wallet.publicKey;
        const lastBlock = this.stateStore.getLastBlock();
        const isExpired = AppUtils.expirationCalculator.calculateLockExpirationStatus(lastBlock, walletLock.expiration);

        return {
            lockId,
            senderPublicKey,
            isExpired,
            amount: walletLock.amount,
            secretHash: walletLock.secretHash,
            recipientId: walletLock.recipientId,
            timestamp: walletLock.timestamp,
            expirationType: walletLock.expiration.type,
            expirationValue: walletLock.expiration.value,
            vendorField: walletLock.vendorField!,
        };
    }
}
